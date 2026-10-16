import { describe, it, expect, vi } from "vitest";
import crypto from "crypto";
import { verifyShopifyWebhookHmac } from "../client";

describe("Shopify Client Utilities", () => {
  const secret = "test_webhook_secret_key_12345";
  const body = JSON.stringify({
    id: 1234567890,
    title: "Eco Handmade Candle",
    vendor: "NatureCraft",
  });

  it("successfully verifies valid Shopify HMAC signature", () => {
    const validHmac = crypto
      .createHmac("sha256", secret)
      .update(body, "utf8")
      .digest("base64");

    const result = verifyShopifyWebhookHmac(body, validHmac, secret);
    expect(result).toBe(true);
  });

  it("rejects an invalid HMAC signature", () => {
    const fakeHmac = "bm90X2FfdmFsaWRfc2lnbmF0dXJl";
    const result = verifyShopifyWebhookHmac(body, fakeHmac, secret);
    expect(result).toBe(false);
  });

  it("rejects mismatched secret key", () => {
    const wrongHmac = crypto
      .createHmac("sha256", "wrong_secret")
      .update(body, "utf8")
      .digest("base64");

    const result = verifyShopifyWebhookHmac(body, wrongHmac, secret);
    expect(result).toBe(false);
  });

  it("rejects empty headers or missing secrets gracefully", () => {
    expect(verifyShopifyWebhookHmac(body, null, secret)).toBe(false);
    expect(verifyShopifyWebhookHmac(body, "", secret)).toBe(false);
    expect(verifyShopifyWebhookHmac(body, "any_sig", "")).toBe(false);
  });
});
