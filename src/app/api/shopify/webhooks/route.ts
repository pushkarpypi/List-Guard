import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { checkProductCompliance, calculateScore } from "@/lib/compliance/scanner";
import { verifyShopifyWebhookHmac } from "@/lib/shopify/client";
import type { Product, StoreConfig } from "@/lib/types";

const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    let topic: string | null = null;
    let shopDomain: string | null = null;
    let hmacHeader: string | null = null;
    let payload: any = null;
    let isPubSub = false;

    // Check if payload is a Google Cloud Pub/Sub Push message
    // (Shopify service account: delivery@shopify-pubsub-webhooks.iam.gserviceaccount.com)
    try {
      const parsedBody = JSON.parse(rawBody);
      if (parsedBody?.message?.data && parsedBody?.message?.attributes) {
        isPubSub = true;
        const attributes = parsedBody.message.attributes;
        topic = attributes["X-Shopify-Topic"] || attributes["x-shopify-topic"] || null;
        shopDomain = attributes["X-Shopify-Shop-Domain"] || attributes["x-shopify-shop-domain"] || null;
        hmacHeader = attributes["X-Shopify-Hmac-Sha256"] || attributes["x-shopify-hmac-sha256"] || null;

        // Base64 decode Pub/Sub data payload
        const decodedString = Buffer.from(parsedBody.message.data, "base64").toString("utf-8");
        payload = JSON.parse(decodedString);
      } else {
        payload = parsedBody;
      }
    } catch {
      // Body is not JSON or plain text
    }

    // If not Pub/Sub, extract from HTTP Headers
    if (!isPubSub) {
      hmacHeader = request.headers.get("X-Shopify-Hmac-Sha256");
      shopDomain = request.headers.get("X-Shopify-Shop-Domain");
      topic = request.headers.get("X-Shopify-Topic");

      // Verify direct HTTP HMAC signature
      if (SHOPIFY_CLIENT_SECRET && hmacHeader) {
        const isValid = verifyShopifyWebhookHmac(rawBody, hmacHeader, SHOPIFY_CLIENT_SECRET);
        if (!isValid) {
          console.error("Shopify Webhook HMAC validation failed.");
          return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }
      }
    }

    if (!shopDomain || !topic) {
      console.warn("Webhook received without required shop domain or topic.");
      return NextResponse.json({ received: true, ignored: true });
    }

    const serviceClient = createServiceClient();

    // Find the merchant associated with this shop
    const { data: connection } = await serviceClient
      .from("shopify_connections")
      .select("user_id, realtime_active")
      .eq("shop_domain", shopDomain)
      .single();

    if (!connection) {
      // Store connection not found or user disconnected, acknowledge 200 OK
      return NextResponse.json({ received: true, unlinked: true });
    }

    // Get user preferences
    const { data: usage } = await serviceClient
      .from("user_usage")
      .select("email_alerts, slack_webhook")
      .eq("user_id", connection.user_id)
      .single();

    // Map webhook payload to Product structure
    const product: Product = {
      id: `shopify-${payload.id}`,
      externalId: String(payload.id),
      title: payload.title || "Untitled Product",
      description: (payload.body_html || "").replace(/<[^>]*>/g, ""),
      tags: payload.tags
        ? (typeof payload.tags === "string" ? payload.tags.split(",").map((t: string) => t.trim()) : payload.tags)
        : [],
      price: parseFloat(payload.variants?.[0]?.price || "0"),
      currency: "USD",
      images: payload.images?.map((img: any) => img.src) || [],
      variants: (payload.variants || []).map((v: any) => ({
        id: String(v.id),
        title: v.title || "Default",
        sku: v.sku || undefined,
        price: parseFloat(v.price || "0"),
        weight: v.weight || undefined,
        weightUnit: v.weight_unit || undefined,
      })),
      shippingProfile: { destinations: ["EU", "US", "GLOBAL"], freeShipping: false },
      platform: "shopify",
    };

    // Run compliance scanner
    const config: StoreConfig = {
      platform: "shopify",
      regions: ["EU", "US", "UK", "GLOBAL"],
      hasPrivacyPolicy: true,
      hasCookieConsent: true,
    };

    const violations = checkProductCompliance(product, config);
    const failedViolations = violations.filter((v) => !v.passed);

    // If critical/warning issues found, send alerts
    if (failedViolations.length > 0) {
      const score = calculateScore(violations);
      const criticalCount = failedViolations.filter((v) => v.severity === "critical").length;

      const { data: authUser } = await serviceClient.auth.admin.getUserById(connection.user_id);

      if (usage?.email_alerts && authUser?.user?.email) {
        await sendInstantEmailAlert(authUser.user.email, {
          productTitle: product.title,
          score,
          issuesFound: failedViolations.length,
          criticalCount,
        });
      }

      if (usage?.slack_webhook) {
        await sendInstantSlackAlert(usage.slack_webhook, {
          productTitle: product.title,
          score,
          issuesFound: failedViolations.length,
          criticalCount,
        });
      }
    }

    return NextResponse.json({ received: true, processed: true, violationsFound: failedViolations.length });
  } catch (error) {
    console.error("Shopify webhook processing error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

async function sendInstantEmailAlert(
  email: string,
  data: { productTitle: string; score: number; issuesFound: number; criticalCount: number }
) {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) return;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "List Guard <alerts@listguard.app>",
        to: email,
        subject: `🚨 Compliance Alert: ${data.productTitle} requires attention`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #ef4444;">Compliance Setup Needed!</h2>
            <p>List Guard just scanned your new listing: <strong>${data.productTitle}</strong></p>
            <div style="background: #0f172a; padding: 20px; border-radius: 8px; color: white; margin: 16px 0;">
              <span style="font-size: 36px; font-weight: bold; color: ${data.score >= 80 ? '#10b981' : '#f59e0b'};">${data.score}/100</span>
              <p style="color: #94a3b8; margin: 4px 0 0;">${data.criticalCount} critical issues detected</p>
            </div>
            <a href="${APP_URL}/app/scan" style="display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Review & Apply 1-Click Fix →
            </a>
          </div>
        `,
      }),
    });
  } catch (err) {
    console.error("Email send failed:", err);
  }
}

async function sendInstantSlackAlert(
  webhookUrl: string,
  data: { productTitle: string; score: number; issuesFound: number; criticalCount: number }
) {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `🚨 *List Guard Real-Time Alert*: ${data.productTitle}`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Product Scanned*: ${data.productTitle}\n*Score*: ${data.score}/100 | *Critical Issues*: ${data.criticalCount}`,
            },
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: { type: "plain_text", text: "Apply Fix in Dashboard" },
                url: `${APP_URL}/app/scan`,
                style: "danger",
              },
            ],
          },
        ],
      }),
    });
  } catch (err) {
    console.error("Slack alert failed:", err);
  }
}
