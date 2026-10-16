import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/service";

const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET!;

function verifyPaddleSignature(body: string, signatureHeader: string): boolean {
  if (!PADDLE_WEBHOOK_SECRET) return true;
  if (!signatureHeader) return false;
  try {
    // Paddle Billing signature header format: ts=123456789;h=abcdef...
    const parts = signatureHeader.split(";").reduce<Record<string, string>>((acc, part) => {
      const [k, v] = part.split("=");
      if (k && v) acc[k.trim()] = v.trim();
      return acc;
    }, {});

    const ts = parts["ts"];
    const hash = parts["h"];

    if (!hash) {
      // Fallback if header is raw signature hex
      const expected = crypto
        .createHmac("sha256", PADDLE_WEBHOOK_SECRET)
        .update(body)
        .digest("hex");
      if (signatureHeader.length !== expected.length) return false;
      return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected));
    }

    const payload = `${ts}:${body}`;
    const expected = crypto
      .createHmac("sha256", PADDLE_WEBHOOK_SECRET)
      .update(payload)
      .digest("hex");

    if (hash.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("paddle-signature") || "";

  // Verify signature if secret is configured
  if (PADDLE_WEBHOOK_SECRET) {
    const isValid = await verifyPaddleSignature(body, signature);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let event: PaddleWebhookEvent;
  try {
    event = JSON.parse(body) as PaddleWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const serviceClient = createServiceClient();

  try {
    switch (event.event_type) {
      case "subscription.created":
      case "subscription.updated": {
        const sub = event.data;
        const customData = sub.custom_data as { user_id?: string } | null;
        const userId = customData?.user_id;

        if (!userId) {
          console.warn("Paddle webhook missing user_id in custom_data");
          break;
        }

        const plan = sub.billing_cycle?.interval === "month" ? "monthly" : "lifetime";

        await serviceClient.from("user_usage").upsert({
          user_id: userId,
          plan,
          paddle_subscription_id: sub.id,
          paddle_customer_id: sub.customer_id,
          subscription_status: sub.status,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
        break;
      }

      case "subscription.canceled": {
        const sub = event.data;
        const customData = sub.custom_data as { user_id?: string } | null;
        const userId = customData?.user_id;

        if (userId) {
          await serviceClient.from("user_usage").update({
            plan: "free",
            subscription_status: "canceled",
            updated_at: new Date().toISOString(),
          }).eq("user_id", userId);
        }
        break;
      }

      case "transaction.completed": {
        // Handle one-time lifetime purchase
        const transaction = event.data;
        const customData = transaction.custom_data as { user_id?: string } | null;
        const userId = customData?.user_id;

        if (userId) {
          await serviceClient.from("user_usage").upsert({
            user_id: userId,
            plan: "lifetime",
            subscription_status: "active",
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" });
        }
        break;
      }

      default:
        // Acknowledge unknown events without error
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paddle webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

interface PaddleWebhookEvent {
  event_type: string;
  data: {
    id: string;
    status: string;
    customer_id: string;
    custom_data: Record<string, unknown> | null;
    billing_cycle?: { interval: string };
  };
}
