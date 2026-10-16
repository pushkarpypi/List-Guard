import type { Product, StoreConfig, RuleResult, Region, RuleCategory } from "../types";
import {
  COMPLIANCE_RULES,
  PROP65_KEYWORDS,
  AGE_RESTRICTED_KEYWORDS,
  PROHIBITED_KEYWORDS,
  CE_REQUIRED_KEYWORDS,
} from "./rules";

/**
 * Run all applicable compliance rules against a product
 */
export function checkProductCompliance(
  product: Product,
  config: StoreConfig
): RuleResult[] {
  const results: RuleResult[] = [];
  const textToAnalyze = `${product.title} ${product.description} ${product.tags.join(" ")}`.toLowerCase();

  for (const rule of COMPLIANCE_RULES) {
    // Only check rules applicable to selected regions
    const applicableRegions = rule.regions.filter(
      (r) => config.regions.includes(r) || r === "GLOBAL"
    );
    if (applicableRegions.length === 0) continue;

    let result: RuleResult;

    switch (rule.id) {
      case "gdpr-privacy-policy":
        result = checkPrivacyPolicy(rule.id, rule.name, rule.category, rule.severity, config, applicableRegions);
        break;
      case "gdpr-cookie-consent":
        result = checkCookieConsent(rule.id, rule.name, rule.category, rule.severity, config, applicableRegions);
        break;
      case "gpsr-responsible-person":
        result = checkResponsiblePerson(rule.id, rule.name, rule.category, rule.severity, config, applicableRegions);
        break;
      case "gpsr-safety-docs":
        result = checkSafetyDocs(rule.id, rule.name, rule.category, rule.severity, textToAnalyze, applicableRegions);
        break;
      case "gpsr-recall-instructions":
        result = checkRecallInstructions(rule.id, rule.name, rule.category, rule.severity, textToAnalyze, applicableRegions);
        break;
      case "gpsr-batch-number":
        result = checkBatchNumber(rule.id, rule.name, rule.category, rule.severity, product, applicableRegions);
        break;
      case "prop65-chemical-warning":
        result = checkProp65(rule.id, rule.name, rule.category, rule.severity, textToAnalyze, applicableRegions);
        break;
      case "age-restricted-product":
        result = checkAgeRestriction(rule.id, rule.name, rule.category, rule.severity, textToAnalyze, applicableRegions);
        break;
      case "policy-prohibited-item":
        result = checkProhibitedItem(rule.id, rule.name, rule.category, rule.severity, textToAnalyze, applicableRegions);
        break;
      case "shipping-restricted-destination":
        result = checkShippingRestrictions(rule.id, rule.name, rule.category, rule.severity, product, config, applicableRegions);
        break;
      case "customs-missing-hs-code":
        result = checkHSCode(rule.id, rule.name, rule.category, rule.severity, textToAnalyze, applicableRegions);
        break;
      case "customs-eu-duty-2026":
        result = checkEUDuty2026(rule.id, rule.name, rule.category, rule.severity, product, config, applicableRegions);
        break;
      case "packaging-ppwr-compliance":
        result = checkPPWR(rule.id, rule.name, rule.category, rule.severity, textToAnalyze, applicableRegions);
        break;
      case "gpsr-ce-mark":
        result = checkCEMarking(rule.id, rule.name, rule.category, rule.severity, textToAnalyze, applicableRegions);
        break;
      case "epr-lucid-id":
        result = checkEPRLucid(rule.id, rule.name, rule.category, rule.severity, textToAnalyze, applicableRegions);
        break;
      default:
        continue;
    }

    results.push(result);
  }

  return results;
}

/**
 * Calculate compliance score from violations
 */
export function calculateScore(violations: RuleResult[]): number {
  const failed = violations.filter((v) => !v.passed);
  if (failed.length === 0) return 100;

  let deduction = 0;
  for (const v of failed) {
    switch (v.severity) {
      case "critical":
        deduction += 20;
        break;
      case "warning":
        deduction += 10;
        break;
      case "info":
        deduction += 3;
        break;
    }
  }

  return Math.max(0, 100 - deduction);
}

// --- Individual Rule Checks ---

function checkPrivacyPolicy(
  id: string, name: string, category: RuleCategory, severity: "critical" | "warning" | "info",
  config: StoreConfig, regions: Region[]
): RuleResult {
  return {
    ruleId: id,
    ruleName: name,
    category,
    severity,
    passed: config.hasPrivacyPolicy,
    message: config.hasPrivacyPolicy
      ? "Privacy policy detected"
      : "No privacy policy found. GDPR requires a visible privacy policy for EU/UK customers.",
    affectedRegions: regions,
  };
}

function checkCookieConsent(
  id: string, name: string, category: RuleCategory, severity: "critical" | "warning" | "info",
  config: StoreConfig, regions: Region[]
): RuleResult {
  return {
    ruleId: id,
    ruleName: name,
    category,
    severity,
    passed: config.hasCookieConsent,
    message: config.hasCookieConsent
      ? "Cookie consent mechanism detected"
      : "No cookie consent banner found. GDPR/ePrivacy requires explicit consent before tracking cookies.",
    affectedRegions: regions,
  };
}

function checkResponsiblePerson(
  id: string, name: string, category: RuleCategory, severity: "critical" | "warning" | "info",
  config: StoreConfig, regions: Region[]
): RuleResult {
  const hasRP = !!(config.responsiblePerson?.name && config.responsiblePerson?.address);
  return {
    ruleId: id,
    ruleName: name,
    category,
    severity,
    passed: hasRP,
    message: hasRP
      ? "EU Responsible Person information found"
      : "Missing EU Responsible Person. GPSR (EU 2023/988) requires an EU-based contact for all products sold in the EU.",
    details: hasRP ? undefined : "You need: Name, EU physical address, email, and phone number of your EU Responsible Person.",
    affectedRegions: regions,
  };
}

function checkSafetyDocs(
  id: string, name: string, category: RuleCategory, severity: "critical" | "warning" | "info",
  text: string, regions: Region[]
): RuleResult {
  const safetyKeywords = ["ce mark", "en 71", "safety standard", "test report", "safety documentation", "conform", "certified"];
  const found = safetyKeywords.some((kw) => text.includes(kw));
  return {
    ruleId: id,
    ruleName: name,
    category,
    severity,
    passed: found,
    message: found
      ? "Safety documentation reference found in listing"
      : "No reference to safety documentation or standards (e.g., CE marking, EN standards). GPSR recommends visible safety information.",
    affectedRegions: regions,
  };
}

function checkRecallInstructions(
  id: string, name: string, category: RuleCategory, severity: "critical" | "warning" | "info",
  text: string, regions: Region[]
): RuleResult {
  const recallKeywords = ["recall", "safety alert", "safety gate", "product return", "safety notification"];
  const found = recallKeywords.some((kw) => text.includes(kw));
  return {
    ruleId: id,
    ruleName: name,
    category,
    severity,
    passed: found,
    message: found
      ? "Recall/safety process reference found"
      : "No recall or safety alert process mentioned. GPSR requires sellers to have a documented recall procedure.",
    affectedRegions: regions,
  };
}

function checkBatchNumber(
  id: string, name: string, category: RuleCategory, severity: "critical" | "warning" | "info",
  product: Product, regions: Region[]
): RuleResult {
  const hasSKU = product.variants.some((v) => v.sku && v.sku.length > 0);
  const textHasBatch = `${product.title} ${product.description}`.toLowerCase().includes("batch") ||
    `${product.title} ${product.description}`.toLowerCase().includes("lot number");
  return {
    ruleId: id,
    ruleName: name,
    category,
    severity,
    passed: hasSKU || textHasBatch,
    message: hasSKU || textHasBatch
      ? "Product identifier (SKU/batch) found"
      : "No batch number, lot number, or SKU found. GPSR requires unique product identifiers for traceability.",
    affectedRegions: regions,
  };
}

function checkProp65(
  id: string, name: string, category: RuleCategory, severity: "critical" | "warning" | "info",
  text: string, regions: Region[]
): RuleResult {
  const foundChemicals = PROP65_KEYWORDS.filter((chem) => text.includes(chem));
  const hasWarning = text.includes("prop 65") || text.includes("proposition 65") || text.includes("known to the state of california");

  if (foundChemicals.length > 0 && !hasWarning) {
    return {
      ruleId: id,
      ruleName: name,
      category,
      severity,
      passed: false,
      message: `Prop 65 chemicals detected (${foundChemicals.join(", ")}) but no warning text found. California requires Prop 65 warnings.`,
      details: `Chemicals found: ${foundChemicals.join(", ")}`,
      affectedRegions: regions,
    };
  }

  return {
    ruleId: id,
    ruleName: name,
    category,
    severity,
    passed: true,
    message: foundChemicals.length > 0
      ? "Prop 65 chemicals mentioned with appropriate warning"
      : "No Prop 65 chemicals detected in listing",
    affectedRegions: regions,
  };
}

function checkAgeRestriction(
  id: string, name: string, category: RuleCategory, severity: "critical" | "warning" | "info",
  text: string, regions: Region[]
): RuleResult {
  const foundKeywords = AGE_RESTRICTED_KEYWORDS.filter((kw) => text.includes(kw));
  const hasAgeWarning = text.includes("18+") || text.includes("21+") || text.includes("age verification") || text.includes("must be");

  if (foundKeywords.length > 0 && !hasAgeWarning) {
    return {
      ruleId: id,
      ruleName: name,
      category,
      severity,
      passed: false,
      message: `Potentially age-restricted product detected (${foundKeywords.slice(0, 3).join(", ")}) without age warning.`,
      affectedRegions: regions,
    };
  }

  return {
    ruleId: id,
    ruleName: name,
    category,
    severity,
    passed: true,
    message: "No age restriction issues detected",
    affectedRegions: regions,
  };
}

function checkProhibitedItem(
  id: string, name: string, category: RuleCategory, severity: "critical" | "warning" | "info",
  text: string, regions: Region[]
): RuleResult {
  const foundKeywords = PROHIBITED_KEYWORDS.filter((kw) => text.includes(kw));

  return {
    ruleId: id,
    ruleName: name,
    category,
    severity,
    passed: foundKeywords.length === 0,
    message: foundKeywords.length > 0
      ? `Potentially prohibited content detected: ${foundKeywords.join(", ")}. Review marketplace policies.`
      : "No prohibited item indicators detected",
    affectedRegions: regions,
  };
}

function checkShippingRestrictions(
  id: string, name: string, category: RuleCategory, severity: "critical" | "warning" | "info",
  product: Product, config: StoreConfig, regions: Region[]
): RuleResult {
  const destinations = product.shippingProfile?.destinations || [];
  const text = `${product.title} ${product.description}`.toLowerCase();

  // Check if shipping to sanctioned countries
  const sanctionedCountries = ["CU", "IR", "KP", "SY"];
  const shippingToSanctioned = destinations.some((d) =>
    sanctionedCountries.includes(d.toUpperCase())
  );

  if (shippingToSanctioned) {
    return {
      ruleId: id,
      ruleName: name,
      category,
      severity: "critical",
      passed: false,
      message: "Product appears to ship to sanctioned countries. Review shipping destinations immediately.",
      affectedRegions: regions,
    };
  }

  // Check product category restrictions
  const isElectronics = ["electronic", "battery", "lithium", "charger", "usb"].some((kw) => text.includes(kw));
  if (isElectronics && config.regions.includes("EU")) {
    return {
      ruleId: id,
      ruleName: name,
      category,
      severity,
      passed: true,
      message: "Electronics product — verify WEEE and RoHS compliance for EU shipments.",
      details: "Consider adding WEEE symbol and RoHS conformity statement.",
      affectedRegions: regions,
    };
  }

  return {
    ruleId: id,
    ruleName: name,
    category,
    severity,
    passed: true,
    message: "No shipping restriction issues detected",
    affectedRegions: regions,
  };
}

function checkHSCode(
  id: string, name: string, category: RuleCategory, severity: "critical" | "warning" | "info",
  text: string, regions: Region[]
): RuleResult {
  const hasHSCode = /\b\d{4}\.\d{2}/.test(text) || text.includes("hs code") || text.includes("tariff code");

  return {
    ruleId: id,
    ruleName: name,
    category,
    severity,
    passed: hasHSCode,
    message: hasHSCode
      ? "HS code reference found"
      : "No HS (Harmonized System) code found. EU customs reform requires HS codes for all imports.",
    affectedRegions: regions,
  };
}

function checkEUDuty2026(
  id: string, name: string, category: RuleCategory, severity: "critical" | "warning" | "info",
  product: Product, config: StoreConfig, regions: Region[]
): RuleResult {
  const isLowValue = product.price < 150;
  const shipsToEU = config.regions.includes("EU");
  const text = `${product.title} ${product.description}`.toLowerCase();
  const hasDutyNote = text.includes("duty") || text.includes("customs") || text.includes("import tax");

  if (isLowValue && shipsToEU && !hasDutyNote) {
    return {
      ruleId: id,
      ruleName: name,
      category,
      severity,
      passed: false,
      message: "Product under €150 shipped to EU without duty disclosure. From July 2026, a flat €3 duty applies per item.",
      affectedRegions: regions,
    };
  }

  return {
    ruleId: id,
    ruleName: name,
    category,
    severity,
    passed: true,
    message: shipsToEU ? "EU customs duty information noted" : "Not shipping to EU",
    affectedRegions: regions,
  };
}

function checkPPWR(
  id: string, name: string, category: RuleCategory, severity: "critical" | "warning" | "info",
  text: string, regions: Region[]
): RuleResult {
  const ppwrKeywords = ["recyclable", "recycling", "packaging material", "ppwr", "sustainable packaging", "eco-friendly packaging"];
  const found = ppwrKeywords.some((kw) => text.includes(kw));

  return {
    ruleId: id,
    ruleName: name,
    category,
    severity,
    passed: found,
    message: found
      ? "Packaging sustainability information found"
      : "No packaging compliance info. EU PPWR (phasing in Aug 2026) will require packaging recyclability and material disclosure.",
    affectedRegions: regions,
  };
}

function checkCEMarking(
  id: string, name: string, category: RuleCategory, severity: "critical" | "warning" | "info",
  text: string, regions: Region[]
): RuleResult {
  const isTargetCategory = CE_REQUIRED_KEYWORDS.some((kw) => text.includes(kw));
  const hasMarkingNotice = text.includes("ce mark") || text.includes("ukca") || text.includes("declaration of conformity");

  if (isTargetCategory && !hasMarkingNotice) {
    return {
      ruleId: id,
      ruleName: name,
      category,
      severity,
      passed: false,
      message: "Product category (electronics/toys/PPE) strongly suggests a CE/UKCA mark is legally required, but no mention was found.",
      affectedRegions: regions,
    };
  }

  return {
    ruleId: id,
    ruleName: name,
    category,
    severity,
    passed: true,
    message: !isTargetCategory ? "Not in a CE/UKCA restricted category" : "Marking disclosure verified",
    affectedRegions: regions,
  };
}

function checkEPRLucid(
  id: string, name: string, category: RuleCategory, severity: "critical" | "warning" | "info",
  text: string, regions: Region[]
): RuleResult {
  const hasEPR = text.includes("lucid") || text.includes("syderep") || text.includes("epr registration") || text.includes("packaging register");

  return {
    ruleId: id,
    ruleName: name,
    category,
    severity,
    passed: hasEPR,
    message: hasEPR
      ? "EPR/LUCID packaging registration noticed"
      : "Missing EPR details. Shipping to Germany or France requires a valid packaging register ID (e.g., LUCID).",
    affectedRegions: regions,
  };
}
