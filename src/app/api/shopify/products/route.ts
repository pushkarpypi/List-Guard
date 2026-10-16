import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { Product } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get Shopify connection for this user
    const serviceClient = createServiceClient();
    let shop_domain: string | null = null;
    let access_token: string | null = null;

    if (user) {
      const { data: connection } = await serviceClient
        .from("shopify_connections")
        .select("shop_domain, access_token")
        .eq("user_id", user.id)
        .single();

      if (connection) {
        shop_domain = connection.shop_domain;
        access_token = connection.access_token;
      }
    }

    if (!access_token && process.env.SHOPIFY_ADMIN_ACCESS_TOKEN) {
      access_token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
      shop_domain = process.env.SHOPIFY_SHOP_DOMAIN || null;
    }

    if (!shop_domain || !access_token) {
      return NextResponse.json({ error: "No Shopify store connected" }, { status: 404 });
    }

    // Fetch all products from Shopify Admin API
    const allProducts: Product[] = [];
    let nextPageUrl: string | null =
      `https://${shop_domain}/admin/api/2024-01/products.json?limit=250&status=active`;

    while (nextPageUrl) {
      const response = await fetch(nextPageUrl, {
        headers: {
          "X-Shopify-Access-Token": access_token,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Shopify API error:", text);
        throw new Error(`Shopify API error: ${response.status}`);
      }

      const data = await response.json() as {
        products: ShopifyProduct[];
      };

      const products = data.products.map(mapShopifyProduct);
      allProducts.push(...products);

      // Handle pagination
      const linkHeader = response.headers.get("Link");
      nextPageUrl = parseLinkHeader(linkHeader);
    }

    return NextResponse.json({ products: allProducts, shopDomain: shop_domain });
  } catch (error) {
    console.error("Shopify products fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Shopify products" },
      { status: 500 }
    );
  }
}

interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  tags: string;
  variants: ShopifyVariant[];
  images: Array<{ src: string }>;
}

interface ShopifyVariant {
  id: number;
  title: string;
  sku: string;
  price: string;
  weight: number;
  weight_unit: string;
}

function mapShopifyProduct(p: ShopifyProduct): Product {
  const firstVariant = p.variants[0];
  return {
    id: `shopify-${p.id}`,
    externalId: String(p.id),
    title: p.title,
    description: p.body_html?.replace(/<[^>]*>/g, "") || "",
    tags: p.tags ? p.tags.split(",").map((t) => t.trim()) : [],
    price: parseFloat(firstVariant?.price || "0"),
    currency: "USD",
    images: p.images.map((img) => img.src),
    variants: p.variants.map((v) => ({
      id: String(v.id),
      title: v.title,
      sku: v.sku || undefined,
      price: parseFloat(v.price),
      weight: v.weight || undefined,
      weightUnit: v.weight_unit || undefined,
    })),
    shippingProfile: {
      destinations: [],
      freeShipping: false,
    },
    platform: "shopify",
  };
}

function parseLinkHeader(header: string | null): string | null {
  if (!header) return null;
  const match = header.match(/<([^>]+)>;\s*rel="next"/);
  return match ? match[1] : null;
}
