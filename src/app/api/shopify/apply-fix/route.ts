import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { applyComplianceNoticeToProduct } from "@/lib/shopify/client";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const {
      productId,
      ruleId,
      ruleName,
      category,
      fixContent,
      customShopDomain,
    }: {
      productId: string | number;
      ruleId: string;
      ruleName: string;
      category: string;
      fixContent: string;
      customShopDomain?: string;
    } = body;

    if (!productId || !ruleId || !fixContent) {
      return NextResponse.json(
        { error: "Missing required parameters (productId, ruleId, fixContent)" },
        { status: 400 }
      );
    }

    let shopDomain: string | null = null;
    let accessToken: string | null = null;

    // 1. Check user's connected Shopify store
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

    // 2. Fallback to server admin credentials if configured
    if (!accessToken && process.env.SHOPIFY_ADMIN_ACCESS_TOKEN) {
      accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
      shopDomain = customShopDomain || process.env.SHOPIFY_SHOP_DOMAIN || null;
    }

    if (!shopDomain || !accessToken) {
      return NextResponse.json(
        {
          error: "No active Shopify connection found. Please connect your Shopify store first.",
          needsConnection: true,
        },
        { status: 404 }
      );
    }

    // 3. Apply the fix directly to Shopify
    const updatedProduct = await applyComplianceNoticeToProduct(
      shopDomain,
      accessToken,
      productId,
      {
        ruleId,
        ruleName: ruleName || "Compliance Notice",
        category: category || "general",
        fixContent,
      }
    );

    return NextResponse.json({
      success: true,
      message: "Compliance notice applied directly to Shopify listing!",
      product: {
        id: updatedProduct.id,
        title: updatedProduct.title,
        tags: updatedProduct.tags,
      },
    });
  } catch (error: any) {
    console.error("Apply fix error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update Shopify product listing" },
      { status: 500 }
    );
  }
}
