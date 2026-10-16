import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID!;
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const shop = searchParams.get("shop");

  const storedState = request.cookies.get("shopify_oauth_state")?.value;
  const storedShop = request.cookies.get("shopify_shop")?.value;

  // Validate CSRF state
  if (!state || state !== storedState) {
    return NextResponse.redirect(`${APP_URL}/app/connect?error=csrf_mismatch`);
  }

  if (!shop || shop !== storedShop) {
    return NextResponse.redirect(`${APP_URL}/app/connect?error=shop_mismatch`);
  }

  if (!code) {
    return NextResponse.redirect(`${APP_URL}/app/connect?error=no_code`);
  }

  try {
    // Exchange code for permanent access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: SHOPIFY_CLIENT_ID,
        client_secret: SHOPIFY_CLIENT_SECRET,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error("Token exchange failed");
    }

    const { access_token } = await tokenResponse.json() as { access_token: string };

    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(`${APP_URL}/app/connect?error=not_authenticated`);
    }

    // Store encrypted token in Supabase (service role to bypass RLS)
    const serviceClient = createServiceClient();
    await serviceClient.from("shopify_connections").upsert({
      user_id: user.id,
      shop_domain: shop,
      access_token: access_token,
      scopes: "read_products,write_products,read_shipping",
      connected_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    const response = NextResponse.redirect(`${APP_URL}/app/scan?connected=shopify&shop=${shop}`);
    // Clear OAuth cookies
    response.cookies.delete("shopify_oauth_state");
    response.cookies.delete("shopify_shop");

    return response;
  } catch (error) {
    console.error("Shopify OAuth error:", error);
    return NextResponse.redirect(`${APP_URL}/app/connect?error=oauth_failed`);
  }
}
