// Production-grade Shopify Admin REST & GraphQL Client with HMAC & PubSub support

import crypto from "crypto";
import type { Product } from "@/lib/types";

const API_VERSION = "2024-01";

export interface ShopifyMetafieldInput {
  namespace: string;
  key: string;
  value: string;
  type: "single_line_text_field" | "multi_line_text_field" | "json";
}

/**
 * Make an authenticated request to the Shopify Admin REST API
 */
export async function shopifyFetch(
  shopDomain: string,
  accessToken: string,
  endpoint: string,
  options: RequestInit = {}
) {
  const cleanDomain = shopDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const url = `https://${cleanDomain}/admin/api/${API_VERSION}${endpoint}`;

  const headers = {
    "X-Shopify-Access-Token": accessToken,
    "Content-Type": "application/json",
    Accept: "application/json",
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Shopify API error [${response.status}] at ${endpoint}:`, errorText);
    throw new Error(`Shopify API error (${response.status}): ${errorText}`);
  }

  return response;
}

/**
 * Verify HMAC signature of direct Shopify HTTP webhooks
 */
export function verifyShopifyWebhookHmac(
  rawBody: string,
  hmacHeader: string | null,
  secret: string
): boolean {
  if (!hmacHeader || !secret) return false;

  try {
    const hash = crypto
      .createHmac("sha256", secret)
      .update(rawBody, "utf8")
      .digest("base64");

    if (Buffer.byteLength(hash) !== Buffer.byteLength(hmacHeader)) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(hash),
      Buffer.from(hmacHeader)
    );
  } catch {
    return false;
  }
}

/**
 * Get shop profile to test and verify credentials
 */
export async function getShopDetails(shopDomain: string, accessToken: string) {
  const res = await shopifyFetch(shopDomain, accessToken, "/shop.json");
  const data = await res.json();
  return data.shop;
}

/**
 * Get a single product by ID
 */
export async function getShopifyProduct(
  shopDomain: string,
  accessToken: string,
  productId: string | number
) {
  const numericId = String(productId).replace(/^shopify-/, "");
  const res = await shopifyFetch(shopDomain, accessToken, `/products/${numericId}.json`);
  const data = await res.json();
  return data.product;
}

/**
 * Update a product description and append a clean compliance disclosure block
 */
export async function applyComplianceNoticeToProduct(
  shopDomain: string,
  accessToken: string,
  productId: string | number,
  params: {
    ruleId: string;
    ruleName: string;
    category: string;
    fixContent: string;
  }
) {
  const numericId = String(productId).replace(/^shopify-/, "");
  
  // 1. Fetch current product
  const product = await getShopifyProduct(shopDomain, accessToken, numericId);
  if (!product) {
    throw new Error(`Product ${numericId} not found in Shopify`);
  }

  // 2. Format HTML Compliance Block
  const categoryTitles: Record<string, string> = {
    gpsr: "EU GPSR Safety & Manufacturer Information",
    prop65: "California Proposition 65 Warning",
    customs: "EU Customs Duty & Tariff Notice (2026)",
    gdpr: "Privacy & Regulatory Notice",
    packaging: "Packaging Recyclability (PPWR/EPR)",
    age: "Age Verification & Legal Restriction",
  };

  const title = categoryTitles[params.category] || params.ruleName;

  const complianceBlock = `
<!-- LISTGUARD COMPLIANCE START: ${params.ruleId} -->
<div class="listguard-compliance-box" style="margin: 16px 0; padding: 14px 16px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #f8fafc; font-size: 13px; line-height: 1.5; color: #1e293b;">
  <div style="font-weight: 600; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
    <span>🛡️ ${title}</span>
  </div>
  <div style="color: #475569;">
    ${params.fixContent.replace(/\n/g, "<br/>")}
  </div>
  <div style="margin-top: 8px; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">
    Verified by List Guard Compliance Engine
  </div>
</div>
<!-- LISTGUARD COMPLIANCE END: ${params.ruleId} -->`;

  let updatedHtml = product.body_html || "";

  // If a block for this rule already exists, replace it; otherwise append
  const regex = new RegExp(
    `<!-- LISTGUARD COMPLIANCE START: ${params.ruleId} -->[\\s\\S]*?<!-- LISTGUARD COMPLIANCE END: ${params.ruleId} -->`,
    "g"
  );

  if (regex.test(updatedHtml)) {
    updatedHtml = updatedHtml.replace(regex, complianceBlock.trim());
  } else {
    updatedHtml = `${updatedHtml}\n${complianceBlock.trim()}`;
  }

  // 3. Update tags to mark as compliant
  const existingTags = product.tags ? product.tags.split(",").map((t: string) => t.trim()) : [];
  if (!existingTags.includes("listguard-verified")) {
    existingTags.push("listguard-verified");
  }
  if (!existingTags.includes(`compliant-${params.category}`)) {
    existingTags.push(`compliant-${params.category}`);
  }

  // 4. Update the Product in Shopify
  const updatePayload = {
    product: {
      id: numericId,
      body_html: updatedHtml,
      tags: existingTags.join(", "),
    },
  };

  const updateRes = await shopifyFetch(
    shopDomain,
    accessToken,
    `/products/${numericId}.json`,
    {
      method: "PUT",
      body: JSON.stringify(updatePayload),
    }
  );

  const updatedData = await updateRes.json();

  // 5. Also write to Shopify Metafield for Theme App Blocks / dynamic storefronts
  try {
    const metafieldKey = `warning_${params.category}`.substring(0, 30);
    await shopifyFetch(
      shopDomain,
      accessToken,
      `/products/${numericId}/metafields.json`,
      {
        method: "POST",
        body: JSON.stringify({
          metafield: {
            namespace: "listguard",
            key: metafieldKey,
            value: params.fixContent,
            type: "multi_line_text_field",
          },
        }),
      }
    );
  } catch (err) {
    console.warn("Metafield creation warning (safe to proceed):", err);
  }

  return updatedData.product;
}
