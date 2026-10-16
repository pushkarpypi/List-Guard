import { NextRequest, NextResponse } from "next/server";

const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID!;
const SHOPIFY_SCOPES = "read_products,write_products,read_shipping";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get("shop");

  if (!shop) {
    return NextResponse.json({ error: "Missing shop domain" }, { status: 400 });
  }

  // Validate shop domain format
  const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/;
  if (!shopRegex.test(shop)) {
    return NextResponse.json({ error: "Invalid shop domain. Must be yourstore.myshopify.com" }, { status: 400 });
  }

  const state = crypto.randomUUID();
  const redirectUri = `${APP_URL}/api/shopify/callback`;

  // Store state in cookie for CSRF protection
  const response = NextResponse.redirect(
    `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_CLIENT_ID}&scope=${SHOPIFY_SCOPES}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`
  );

  response.cookies.set("shopify_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
  });

  response.cookies.set("shopify_shop", shop, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
  });

  return response;
}
