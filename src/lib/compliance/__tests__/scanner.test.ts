import { describe, it, expect } from "vitest";
import { checkProductCompliance, calculateScore } from "../scanner";
import type { Product, StoreConfig } from "../../types";

describe("Compliance Scanner Engine", () => {
  const baseConfig: StoreConfig = {
    platform: "shopify",
    regions: ["EU", "US"],
    hasPrivacyPolicy: true,
    hasCookieConsent: true,
    responsiblePerson: {
      name: "EU Rep Ltd",
      address: "123 Euro St",
      email: "eu@rep.com",
    },
  };

  const baseProduct: Product = {
    id: "test-1",
    externalId: "test-1",
    title: "Basic T-Shirt",
    description: "A simple cotton t-shirt.",
    tags: ["clothing", "cotton"],
    price: 20,
    currency: "USD",
    images: [],
    variants: [{ id: "v1", title: "Standard", sku: "TSHIRT-01", price: 20 }],
    shippingProfile: { destinations: ["EU", "US"], freeShipping: false },
    platform: "shopify",
  };

  const perfectProduct: Product = {
    ...baseProduct,
    title: "Basic T-Shirt Batch 01",
    description: "A simple cotton t-shirt. CE mark certified. HS Code 6109.10. In case of recall, contact safety@test.com. EU buyers pay customs duty. EPR Registration LUCID 1234. 100% recyclable packaging.",
    price: 200,
  };

  it("should pass all checks for a fully compliant basic product", () => {
    const results = checkProductCompliance(perfectProduct, baseConfig);
    const score = calculateScore(results);

    // Filter out rules that strictly failed
    const failed = results.filter((r) => !r.passed);
    if (failed.length > 0) { console.log(failed); }
    
    // There might be info rules (like €3 duty) but it shouldn't fail criticals
    expect(score).toBeGreaterThanOrEqual(90);
    expect(failed.length).toBe(0);
  });

  it("should fail critical GDPR rules if store config is missing privacy/cookie policies", () => {
    const badConfig = { ...baseConfig, hasPrivacyPolicy: false, hasCookieConsent: false };
    const results = checkProductCompliance(baseProduct, badConfig);
    
    const gdprResults = results.filter(r => r.category === "gdpr");
    expect(gdprResults.every(r => r.passed === false)).toBe(true);
    
    const score = calculateScore(results);
    expect(score).toBeLessThan(70); // 100 - 20 - 20
  });

  it("should fail Prop 65 specifically if chemical found but no warning text", () => {
    const toxicProduct = {
      ...baseProduct,
      description: "Made with durable materials and trace amounts of lead.",
    };

    const results = checkProductCompliance(toxicProduct, baseConfig);
    const prop65Result = results.find(r => r.ruleId === "prop65-chemical-warning");
    
    expect(prop65Result).toBeDefined();
    expect(prop65Result?.passed).toBe(false);
  });

  it("should pass Prop 65 if chemical found WITH warning text", () => {
    const compliantToxicProduct = {
      ...baseProduct,
      description: "Made with trace amounts of lead. ⚠️ WARNING: Prop 65 known to the state of California.",
    };

    const results = checkProductCompliance(compliantToxicProduct, baseConfig);
    const prop65Result = results.find(r => r.ruleId === "prop65-chemical-warning");
    
    expect(prop65Result).toBeDefined();
    expect(prop65Result?.passed).toBe(true);
  });

  it("should flag EU Customs Duty (July 2026) for < €150 items shipping to EU", () => {
    const results = checkProductCompliance(baseProduct, baseConfig);
    const dutyResult = results.find(r => r.ruleId === "customs-eu-duty-2026");
    
    expect(dutyResult).toBeDefined();
    expect(dutyResult?.passed).toBe(false);
  });

  it("should pass EU Customs Duty if description explicitly mentions customs duty", () => {
    const dutyProduct = {
      ...baseProduct,
      description: "A simple cotton t-shirt. Note: EU buyers are responsible for customs duty.",
    };
    const results = checkProductCompliance(dutyProduct, baseConfig);
    const dutyResult = results.find(r => r.ruleId === "customs-eu-duty-2026");
    
    expect(dutyResult?.passed).toBe(true);
  });

  describe("New Phase 3 GPSR & EPR Checks", () => {
    it("should fail CE Marking validation for electronic items without a declaration", () => {
      const ledProduct = {
        ...baseProduct,
        title: "LED Bluetooth Speaker",
        tags: ["electronic", "audio"],
      };

      const results = checkProductCompliance(ledProduct, baseConfig);
      const ceResult = results.find(r => r.ruleId === "gpsr-ce-mark");
      
      expect(ceResult).toBeDefined();
      expect(ceResult?.passed).toBe(false);
      expect(ceResult?.severity).toBe("critical");
    });

    it("should pass CE Marking validation for electronic items with a declaration", () => {
      const safeLedProduct = {
        ...baseProduct,
        title: "LED Bluetooth Speaker",
        description: "High quality audio. CE mark and Declaration of Conformity included in box.",
      };

      const results = checkProductCompliance(safeLedProduct, baseConfig);
      const ceResult = results.find(r => r.ruleId === "gpsr-ce-mark");
      
      expect(ceResult?.passed).toBe(true);
    });

    it("should fail EPR packaging check for EU shipments without LUCID/SYDEREP ID", () => {
      const results = checkProductCompliance(baseProduct, baseConfig);
      const eprResult = results.find(r => r.ruleId === "epr-lucid-id");
      
      expect(eprResult).toBeDefined();
      expect(eprResult?.passed).toBe(false);
    });

    it("should pass EPR packaging check if LUCID ID is present in description", () => {
      const eprProduct = {
        ...baseProduct,
        description: "A simple cotton t-shirt. EPR Registration / LUCID DE123456789.",
      };

      const results = checkProductCompliance(eprProduct, baseConfig);
      const eprResult = results.find(r => r.ruleId === "epr-lucid-id");
      
      expect(eprResult?.passed).toBe(true);
    });
  });
});
