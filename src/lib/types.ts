// Types for the Compliance Guardian application

export interface Product {
  id: string;
  externalId?: string;
  title: string;
  description: string;
  tags: string[];
  price: number;
  currency: string;
  images: string[];
  variants: ProductVariant[];
  shippingProfile?: ShippingProfile;
  platform: "shopify" | "etsy" | "csv";
}

export interface ProductVariant {
  id: string;
  title: string;
  sku?: string;
  price: number;
  weight?: number;
  weightUnit?: string;
}

export interface ShippingProfile {
  destinations: string[];
  freeShipping: boolean;
  processingTime?: string;
}

export interface StoreConfig {
  platform: "shopify" | "etsy" | "csv";
  shopDomain?: string;
  regions: Region[];
  hasPrivacyPolicy: boolean;
  hasCookieConsent: boolean;
  responsiblePerson?: ResponsiblePerson;
}

export interface ResponsiblePerson {
  name: string;
  address: string;
  email: string;
  phone?: string;
}

export type Region = "EU" | "US" | "CA" | "UK" | "IN" | "GLOBAL";

export type RuleCategory =
  | "gdpr"
  | "gpsr"
  | "prop65"
  | "shipping"
  | "customs"
  | "age"
  | "packaging"
  | "policy";

export type Severity = "critical" | "warning" | "info";

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  category: RuleCategory;
  severity: Severity;
  regions: Region[];
  fixPrompt: string;
}

export interface RuleResult {
  ruleId: string;
  ruleName: string;
  category: RuleCategory;
  severity: Severity;
  passed: boolean;
  message: string;
  details?: string;
  affectedRegions: Region[];
}

export interface ProductScanResult {
  productId: string;
  productTitle: string;
  violations: RuleResult[];
  score: number;
  fixesGenerated: GeneratedFix[];
}

export interface GeneratedFix {
  ruleId: string;
  ruleName: string;
  category: RuleCategory;
  fixType: "text" | "label" | "policy" | "disclaimer";
  content: string;
  language: "en" | "es";
  region: Region;
}

export interface ScanSummary {
  id: string;
  totalProducts: number;
  issuesFound: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  complianceScore: number;
  regions: Region[];
  status: "pending" | "running" | "completed" | "failed";
  createdAt: string;
  completedAt?: string;
  results: ProductScanResult[];
}

export interface UserUsage {
  scansThisMonth: number;
  productsScannedTotal: number;
  plan: "free" | "monthly" | "lifetime";
  paddleSubscriptionId?: string;
}

// i18n types
export type Locale = "en" | "es";

export interface TranslationStrings {
  [key: string]: string | TranslationStrings;
}
