import type { ComplianceRule } from "../types";

export const COMPLIANCE_RULES: ComplianceRule[] = [
  // GDPR Rules
  {
    id: "gdpr-privacy-policy",
    name: "Missing Privacy Policy",
    description: "EU law requires a visible privacy policy link for any store collecting personal data.",
    category: "gdpr",
    severity: "critical",
    regions: ["EU", "UK"],
    fixPrompt: `Generate a concise, compliant privacy policy snippet for an e-commerce store selling {productType}. 
Include: data collection purposes, third-party sharing, user rights (access, deletion, portability), cookie usage, and contact info placeholder. 
Format: HTML-ready text, under 500 words. Comply with GDPR Article 13/14.`,
  },
  {
    id: "gdpr-cookie-consent",
    name: "No Cookie Consent Banner",
    description: "GDPR and ePrivacy Directive require explicit cookie consent before tracking.",
    category: "gdpr",
    severity: "critical",
    regions: ["EU", "UK"],
    fixPrompt: `Generate cookie consent banner text for an e-commerce store. Include: 
- What cookies are used (essential, analytics, marketing)
- How to accept/reject
- Link to full cookie policy
Format: Short banner text + detailed popup text. Under 200 words total.`,
  },

  // GPSR Rules
  {
    id: "gpsr-responsible-person",
    name: "Missing EU Responsible Person",
    description: "GPSR requires all products sold in the EU to display an EU-based Responsible Person with name, address, and contact details.",
    category: "gpsr",
    severity: "critical",
    regions: ["EU"],
    fixPrompt: `Generate a GPSR-compliant "Responsible Person" label text template for product listings sold in the EU.
Include placeholders for: Company name, EU address, email, phone.
Add note about role under EU Regulation 2023/988.
Format: Copy-paste ready for product description.`,
  },
  {
    id: "gpsr-safety-docs",
    name: "No Safety Documentation Reference",
    description: "GPSR requires manufacturers to maintain technical documentation and reference safety standards.",
    category: "gpsr",
    severity: "warning",
    regions: ["EU"],
    fixPrompt: `Generate a safety documentation reference block for a {productType} listing.
Include: CE marking reference, applicable EN standards, safety test mention, and documentation availability statement.
Format: Product listing paragraph, under 100 words.`,
  },
  {
    id: "gpsr-recall-instructions",
    name: "No Recall/Safety Alert Process",
    description: "GPSR requires sellers to have a recall process and communicate it to consumers.",
    category: "gpsr",
    severity: "warning",
    regions: ["EU"],
    fixPrompt: `Generate a product recall readiness statement for an e-commerce product listing.
Include: How customers will be notified of recalls, return process, Safety Gate portal reference.
Format: Short policy statement, under 150 words.`,
  },
  {
    id: "gpsr-batch-number",
    name: "Missing Batch/Lot Number",
    description: "GPSR requires unique product identifiers (batch, lot, or serial number) for traceability.",
    category: "gpsr",
    severity: "warning",
    regions: ["EU"],
    fixPrompt: `Generate guidance text for adding batch/lot numbers to product listings per GPSR requirements.
Include: Where to place the number, format suggestions, and why it's required.
Format: Instructional paragraph + example.`,
  },

  // Prop 65
  {
    id: "prop65-chemical-warning",
    name: "Prop 65 Chemical Warning Required",
    description: "California Proposition 65 requires warnings for products containing listed chemicals.",
    category: "prop65",
    severity: "critical",
    regions: ["CA", "US"],
    fixPrompt: `Generate a California Proposition 65 warning text for a product that may contain {chemicals}.
Use the official Safe Harbor warning format.
Include both short-form and long-form versions.
Format: Copy-paste ready, include the ⚠️ WARNING prefix.`,
  },

  // Age Restrictions
  {
    id: "age-restricted-product",
    name: "Age-Restricted Product Without Warning",
    description: "Products restricted by age (alcohol, weapons, adult content) must display appropriate warnings.",
    category: "age",
    severity: "critical",
    regions: ["GLOBAL"],
    fixPrompt: `Generate age restriction warning text for a {productType} product listing.
Include: Minimum age requirement, verification statement, legal compliance note.
Multi-region format covering EU, US, and UK requirements.`,
  },

  // Policy / Prohibited Items
  {
    id: "policy-prohibited-item",
    name: "Potentially Prohibited Item",
    description: "This product may violate marketplace policies or regional import restrictions.",
    category: "policy",
    severity: "critical",
    regions: ["GLOBAL"],
    fixPrompt: `Generate a compliance review checklist for a product flagged as potentially prohibited.
Include: Common reasons for prohibition, steps to verify legality, documentation needed.
Format: Actionable checklist.`,
  },

  // Shipping
  {
    id: "shipping-restricted-destination",
    name: "Shipping to Restricted Destination",
    description: "This product may be restricted from shipping to certain countries due to import bans or regulations.",
    category: "shipping",
    severity: "warning",
    regions: ["GLOBAL"],
    fixPrompt: `Generate a shipping restriction disclaimer for products that cannot be shipped to certain countries.
Include placeholder for restricted countries list and reason.
Format: Copy-paste product listing text.`,
  },

  // Customs 2026
  {
    id: "customs-missing-hs-code",
    name: "Missing HS Code for EU Shipments",
    description: "EU customs reform requires HS (Harmonized System) codes for all products shipped to the EU.",
    category: "customs",
    severity: "warning",
    regions: ["EU"],
    fixPrompt: `Suggest the most likely HS code(s) for a {productType} product.
Provide: 6-digit HS code, description, and how to verify.
Include note about EU customs declaration requirements effective July 2026.`,
  },
  {
    id: "customs-eu-duty-2026",
    name: "No €3 EU Duty Disclosure",
    description: "From July 1, 2026, all parcels under €150 sent to the EU incur a flat €3 duty. Sellers should disclose this to buyers.",
    category: "customs",
    severity: "info",
    regions: ["EU"],
    fixPrompt: `Generate a buyer-facing customs duty notice for EU-bound shipments.
Reference the July 2026 EU Customs Reform (€3 flat duty per item on parcels < €150).
Include: What it means for the buyer, who pays, and estimated delivery impact.
Format: Short listing note, under 100 words.`,
  },

  // Packaging
  {
    id: "packaging-ppwr-compliance",
    name: "PPWR Packaging Compliance",
    description: "EU Packaging and Packaging Waste Regulation (PPWR) phases in from August 2026 with recycling and labeling requirements.",
    category: "packaging",
    severity: "info",
    regions: ["EU"],
    fixPrompt: `Generate a PPWR preparedness statement for a product listing.
Include: Packaging recyclability commitment, material disclosure, EU PPWR timeline reference.
Format: Short sustainability note for product listings.`,
  },
  {
    id: "gpsr-ce-mark",
    name: "Missing CE/UKCA Mark Declaration",
    description: "Certain product categories (electronics, toys, PPE) strictly require a visible CE/UKCA mark compliance declaration.",
    category: "gpsr",
    severity: "critical",
    regions: ["EU", "UK"],
    fixPrompt: `Generate a CE/UKCA conformity declaration for a {productType} listing.
Include: Acknowledgment of conformity with relevant European/UK directives.
Format: Short paragraph.`,
  },
  {
    id: "epr-lucid-id",
    name: "Missing EPR/LUCID Registration Info",
    description: "Shipping to Germany/France requires explicit EPR packaging registration (e.g. LUCID ID).",
    category: "packaging",
    severity: "critical",
    regions: ["EU"],
    fixPrompt: `Generate an EPR (Extended Producer Responsibility) packaging compliance note for shipments to Germany and France.
Include: Placeholder for LUCID ID and SYDEREP ID.
Format: Product listing line, under 30 words.`,
  },
];

// Chemical keywords that trigger Prop 65
export const PROP65_KEYWORDS = [
  "lead", "cadmium", "mercury", "arsenic", "formaldehyde",
  "bisphenol", "bpa", "phthalate", "acrylamide", "benzene",
  "asbestos", "chromium", "nickel", "vinyl chloride", "styrene",
  "toluene", "di(2-ethylhexyl)phthalate", "dehp", "crystalline silica",
  "wood dust", "carbon black", "titanium dioxide", "pfas", "pfoa", "pfos",
];

// Age-restricted product indicators
export const AGE_RESTRICTED_KEYWORDS = [
  "alcohol", "wine", "beer", "spirits", "liquor", "whiskey", "vodka",
  "tobacco", "cigarette", "vape", "e-cigarette", "nicotine",
  "knife", "sword", "weapon", "firearm", "ammunition", "airsoft",
  "adult", "18+", "mature", "explicit", "cannabis", "cbd", "thc",
  "firework", "pyrotechnic",
];

// Prohibited item indicators
export const PROHIBITED_KEYWORDS = [
  "counterfeit", "replica", "knockoff", "fake branded",
  "ivory", "endangered species", "animal fur",
  "surveillance", "spy camera", "hidden camera",
  "lock pick", "lockpicking",
  "drug paraphernalia",
  "human remains", "body parts",
];

// Shipping restricted countries for common categories
export const SHIPPING_RESTRICTIONS: Record<string, string[]> = {
  electronics: ["CU", "IR", "KP", "SY", "RU"],
  cosmetics: ["SA", "NG"],
  food: ["AU", "NZ", "JP"],
  plants: ["AU", "NZ", "US"],
  general_sanctions: ["CU", "IR", "KP", "SY", "RU", "BY"],
};

export const CE_REQUIRED_KEYWORDS = [
  "electronic", "battery", "usb", "bluetooth", "charger", "led", "screen",
  "toy", "plush", "child", "action figure", "puzzle",
  "ppe", "mask", "goggle", "helmet", "safety glasses", "protective",
  "sunglasses", "machinery",
];
