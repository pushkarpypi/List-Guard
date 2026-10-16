import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getShopDetails } from "@/lib/shopify/client";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json().catch(() => ({}));
    const { customShopDomain, customToken } = body;

    let shopDomain = customShopDomain;
    let accessToken = customToken;

    if (!shopDomain || !accessToken) {
      if (user) {
        const serviceClient = createServiceClient();
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

      if (!accessToken && process.env.SHOPIFY_ADMIN_ACCESS_TOKEN) {
        accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
        shopDomain = shopDomain || process.env.SHOPIFY_SHOP_DOMAIN;
      }
    }

    if (!shopDomain || !accessToken) {
      return NextResponse.json(
        { error: "Missing store domain or access token to test." },
        { status: 400 }
      );
    }

    // Clean domain
    const cleanDomain = shopDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");

    // Fetch shop details from Shopify API
    const shop = await getShopDetails(cleanDomain, accessToken);

    return NextResponse.json({
      success: true,
      shop: {
        name: shop.name,
        domain: shop.domain,
        myshopifyDomain: shop.myshopify_domain,
        currency: shop.currency,
        country: shop.country_name,
        planName: shop.plan_name,
        email: shop.email,
      },
    });
  } catch (error: any) {
    console.error("Shopify test connection error:", error);
    return NextResponse.json(
      { error: error.message || "Could not connect to Shopify store. Check domain and token." },
      { status: 400 }
    );
  }
}
