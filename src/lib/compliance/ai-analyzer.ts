import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Product, Region, GeneratedFix, RuleResult } from "../types";
import { COMPLIANCE_RULES } from "./rules";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const FALLBACK_MODELS = ["gemini-3.5-flash", "gemini-3.7-flash", "gemini-3.8-flash", "gemini-flash-latest"];

async function generateWithFailover(prompt: string | any[]): Promise<string> {
  let lastError: any = null;
  for (const modelName of FALLBACK_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt as any);
      return result.response.text();
    } catch (err: any) {
      lastError = err;
      console.warn(`Gemini model ${modelName} failed, trying next candidate...`);
    }
  }
  throw lastError || new Error("All Gemini model candidates failed.");
}

/**
 * Use Gemini AI to perform deep analysis on a product listing
 */
export async function analyzeProductWithAI(
  product: Product,
  regions: Region[]
): Promise<RuleResult[]> {
  try {

    const prompt = `You are an e-commerce compliance expert. Analyze this product listing for regulatory violations.

Product Title: ${product.title}
Product Description: ${product.description}
Tags: ${product.tags.join(", ")}
Price: ${product.price} ${product.currency}
Destination Regions: ${regions.join(", ")}

Check for ALL of these violations:
1. GDPR: Does the product listing contain or require privacy-related disclosures?
2. GPSR (EU General Product Safety Regulation): Is there a Responsible Person mentioned? Any safety standards referenced? Batch/lot numbers?
3. Prop 65 (California): Does the product likely contain chemicals requiring a Prop 65 warning? (e.g., lead in jewelry, cadmium in plastics, formaldehyde in textiles)
4. Age restrictions: Is this product age-restricted? (alcohol, weapons, adult content, tobacco, vaping)
5. Prohibited items: Does this violate common marketplace policies? (counterfeits, endangered species products, surveillance equipment)
6. Shipping restrictions: Are there import bans for this product type in the target regions?
7. EU Customs 2026: For products under €150, note the new €3 flat duty requirement from July 2026.
8. HS codes: Can you suggest an appropriate HS code for customs?
9. Packaging (PPWR): Any packaging sustainability concerns?

Return ONLY valid JSON in this exact format:
{
  "violations": [
    {
      "rule_id": "string (use ids like: gdpr-ai-flag, gpsr-ai-flag, prop65-ai-flag, age-ai-flag, prohibited-ai-flag, shipping-ai-flag, customs-ai-flag, packaging-ai-flag)",
      "severity": "critical|warning|info",
      "category": "gdpr|gpsr|prop65|age|policy|shipping|customs|packaging",
      "message": "Clear explanation of the issue",
      "suggestion": "What the seller should do"
    }
  ],
  "suggested_hs_code": "XXXX.XX or null",
  "risk_summary": "One sentence overall risk assessment"
}`;

    const text = await generateWithFailover(prompt);

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);

    return (parsed.violations || []).map((v: {
      rule_id: string;
      severity: "critical" | "warning" | "info";
      category: string;
      message: string;
      suggestion?: string;
    }) => ({
      ruleId: v.rule_id,
      ruleName: v.message.substring(0, 60),
      category: v.category as RuleResult["category"],
      severity: v.severity,
      passed: false,
      message: v.message,
      details: v.suggestion,
      affectedRegions: regions,
    }));
  } catch (error) {
    console.error("AI analysis error:", error);
    return [];
  }
}

/**
 * Generate fix text for a specific violation using Gemini AI
 */
export async function generateFixText(
  violation: RuleResult,
  product: Product,
  language: "en" | "es" = "en"
): Promise<GeneratedFix | null> {
  try {
    const rule = COMPLIANCE_RULES.find((r) => r.id === violation.ruleId);
    const fixPrompt = rule?.fixPrompt || `Generate compliance fix text for: ${violation.message}`;

    const prompt = `${fixPrompt.replace("{productType}", product.title).replace("{chemicals}", violation.details || "unknown chemicals")}

Product: ${product.title}
Issue: ${violation.message}
${violation.details ? `Details: ${violation.details}` : ""}

Language: ${language === "es" ? "Spanish (Español)" : "English"}
${language === "es" ? "Generate the text entirely in Spanish." : ""}

IMPORTANT: Return ONLY the ready-to-use text that can be directly copy-pasted into a product listing or policy page. No explanations or metadata.`;

    const fixContent = (await generateWithFailover(prompt)).trim();

    return {
      ruleId: violation.ruleId,
      ruleName: violation.ruleName,
      category: violation.category,
      fixType: getCategoryFixType(violation.category),
      content: fixContent,
      language,
      region: violation.affectedRegions[0] || "GLOBAL",
    };
  } catch (error) {
    console.error("Fix generation error:", error);
    return null;
  }
}

/**
 * Batch generate fixes for multiple violations
 */
export async function generateBatchFixes(
  violations: RuleResult[],
  product: Product,
  language: "en" | "es" = "en"
): Promise<GeneratedFix[]> {
  const fixes: GeneratedFix[] = [];

  // Process in parallel with rate limiting (max 3 concurrent)
  const failedViolations = violations.filter((v) => !v.passed);
  const batchSize = 3;

  for (let i = 0; i < failedViolations.length; i += batchSize) {
    const batch = failedViolations.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((v) => generateFixText(v, product, language))
    );
    fixes.push(...batchResults.filter((f): f is GeneratedFix => f !== null));
  }

  return fixes;
}

function getCategoryFixType(category: string): GeneratedFix["fixType"] {
  switch (category) {
    case "gdpr":
      return "policy";
    case "gpsr":
      return "label";
    case "prop65":
      return "disclaimer";
    default:
      return "text";
  }
}
