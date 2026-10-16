import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Register a Shopify Webhook for "products/create" and "products/update".
 * Premium-gated feature.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const serviceClient = createServiceClient();
    let isPremium = true;

    if (user) {
      const { data: usage } = await serviceClient
        .from("user_usage")
        .select("plan")
        .eq("user_id", user.id)
        .single();

      if (usage && usage.plan === "free") {
        isPremium = false;
      }
    }

    if (!isPremium) {
      return NextResponse.json(
        { error: "Real-time automated webhooks require a Pro or Lifetime plan." },
        { status: 403 }
      );
    }

    // Fetch the shop connection
    let shopDomain: string | null = null;
    let accessToken: string | null = null;

    if (user) {
      const { data: connection } = await serviceClient
        .from("shopify_connections")
        .select("shop_domain, access_token")
        .eq("user_id", user.id)
        .single();

      if (connection) {
        shopDomain = connection.shop_domain;
        accessToken = connection.access_token;
      }
    }

    if (!shopDomain && process.env.SHOPIFY_ADMIN_ACCESS_TOKEN) {
      shopDomain = process.env.SHOPIFY_SHOP_DOMAIN || null;
      accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
    }

    if (!shopDomain || !accessToken) {
      return NextResponse.json({ error: "No Shopify connection found. Please connect your store first." }, { status: 404 });
    }

    const webhookEndpoint = `${APP_URL}/api/shopify/webhooks`;

    // Ensure we register webhooks using Shopify API
    const webhooksToRegister = [
      { topic: "products/create" },
      { topic: "products/update" },
    ];

    const results = await Promise.all(
      webhooksToRegister.map(async (hook) => {
        const response = await fetch(`https://${shopDomain}/admin/api/2024-01/webhooks.json`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": accessToken,
          },
          body: JSON.stringify({
            webhook: {
              topic: hook.topic,
              address: webhookEndpoint,
              format: "json",
            },
          }),
        });

        // Ignore 422 Unprocessable Entity - means it's already registered
        if (!response.ok && response.status !== 422) {
          const text = await response.text();
          console.error(`Failed to register ${hook.topic}: ${text}`);
          return false;
        }

        return true;
      })
    );

    const success = results.every(Boolean);

    if (!success) {
      return NextResponse.json({ error: "Failed to register one or more webhooks." }, { status: 500 });
    }

    // Mark as real-time active in DB if user is logged in
    if (user) {
      await serviceClient.from("shopify_connections").update({
        realtime_active: true,
        updated_at: new Date().toISOString(),
      }).eq("user_id", user.id);
    }

    return NextResponse.json({ success: true, message: "Real-time compliance alerts activated." });
  } catch (error) {
    console.error("Webhook registration error:", error);
    return NextResponse.json({ error: "Server error during registration." }, { status: 500 });
  }
}
