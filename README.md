<div align="center">

# 🛡️ List Guard

### AI-Powered Cross-Border E-Commerce Compliance Engine for Shopify & Etsy

[![Next.js 16](https://img.shields.io/badge/Next.js-16.2.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.2.4-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-Passed_14/14-6E9F18?style=for-the-badge&logo=vitest)](https://vitest.dev/)
[![Shopify API](https://img.shields.io/badge/Shopify_API-2024--01-96BF48?style=for-the-badge&logo=shopify)](https://shopify.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

<p align="center">
  <b>Automated regulatory protection against EU GPSR, California Prop 65, 2026 EU Customs Tariff changes, and EPR packing laws.</b><br/>
  Zero catalog data leaks. 1-Click Shopify auto-remediation. Smart Geo-Fenced Storefront Liquid widget.
</p>

[Key Features](#-key-features) •
[Why List Guard?](#-the-2026-regulatory-tsunami) •
[Architecture](#-architecture) •
[Quick Start](#-quick-start) •
[Shopify Integration](#-shopify-integration) •
[Security & Privacy](#-zero-cloud-footprint-privacy)

---

</div>

## 📌 Overview

**List Guard** is a production-grade regulatory compliance engine tailored specifically for solo merchants, direct-to-consumer (DTC) brands, and cross-border sellers on **Shopify** and **Etsy**. 

International cross-border regulations in 2026—most notably the **EU General Product Safety Regulation (GPSR)**, **California Proposition 65**, the **EU Customs €3 flat duty**, and **German LUCID/EPR registers**—expose cross-border merchants to instant customs seizures, marketplace de-listings, and statutory fines reaching up to €15,000 per violation.

List Guard audits product catalogs in seconds, identifies compliance vulnerabilities, generates legally referenced disclaimers, and mutates Shopify listings directly via the Admin API with **1-Click Remediation**.

---

## ⚡ Key Features

- **⚡ 1-Click Shopify Listing Mutation:** Don't just detect violations—fix them instantly. Automatically injects compliant legal disclaimers and structured `listguard` metafields directly into Shopify product descriptions.
- **🌍 Geo-Fenced Liquid Storefront Widget:** Automatically generates an intelligent Liquid theme snippet that displays GPSR Responsible Person contacts and Prop 65 warnings **exclusively to EU and California visitors**, preserving conversion rates for domestic buyers.
- **🛡️ 13+ Built-in Regulatory Rule Engines:**
  - **EU GPSR (EU 2023/988):** Verifies EU Responsible Person declarations, manufacturer contact info, CE markings, and age warnings.
  - **California Prop 65:** Enforces exact statutory warnings for lead, phthalates, nickel, and leather chemicals.
  - **2026 EU Customs Package:** Automatically audits HS codes, country of origin (COO), and flags packages susceptible to the sub-€150 flat customs duty.
  - **German LUCID & French EPR:** Audits packaging registration disclosures and recycling symbology.
  - **GDPR & ePrivacy:** Detects missing privacy disclosures and unconsented tracker disclosures.
- **🤖 Deep AI Semantic Scanner:** Integrates **Google Gemini AI** to detect non-obvious hidden hazards (e.g., lead risk in vintage jewelry, choking hazard in uncertified plush toys, lack of batch traceability).
- **🔒 Zero-Cloud-Footprint Architecture:** All catalog scans and product data are encrypted client-side using **AES-GCM (256-bit)** inside local IndexedDB. Your proprietary product catalog and margins are never stored in a central cloud database.
- **🔄 Enterprise Dual Webhook Ingestion:** Supports real-time listing scan triggers via both standard HTTP HMAC webhooks and **Google Cloud Pub/Sub** push messages (`delivery@shopify-pubsub-webhooks.iam.gserviceaccount.com`).
- **🤝 Verified EU Responsible Person Directory:** Built-in marketplace connecting non-EU merchants with vetted EU Authorised Representatives (AR) to solve the #1 cross-border trade blocker.

---

## 🌊 The 2026 Regulatory Tsunami

| Regulation | Jurisdiction | Mandatory Merchant Requirement | List Guard Solution |
| :--- | :--- | :--- | :--- |
| **GPSR (EU 2023/988)** | European Union | EU-domiciled Responsible Person + physical postal/email address on listings | Injects verified EU RP postal block & CE technical documentation |
| **Proposition 65** | California, USA | Specific verbatim chemical warning labels prior to checkout | Injects required California OEHHA safe harbor warning text |
| **2026 EU Customs Tariff** | European Union | Mandatory 6-8 digit HS codes + COO declarations on all parcels under €150 | Verifies HS code presence & flags missing origin profiles |
| **VerpackG (LUCID)** | Germany / France | Public LUCID registration number & EPR packaging producer declarations | Audits dual-system recycling registration status |

---

## 🏗️ Architecture

```mermaid
graph TD
    A[Shopify Store / Etsy CSV] -->|OAuth 2.0 / Admin API / CSV Parser| B[List Guard Ingestion Layer]
    B --> C{Hybrid Audit Pipeline}
    C -->|Static Rule Check| D[Rules Engine (13+ Trade Mandates)]
    C -->|Semantic Analysis| E[Google Gemini AI Engine]
    D & E --> F[Compliance Scoring & Risk Aggregator]
    F -->|AES-GCM 256-bit| G[(Client-Side Encrypted IndexedDB)]
    F --> H[1-Click Shopify Fix API]
    H -->|Admin REST / Metafields| I[Shopify Product Catalog]
    F --> J[Geo-Fenced Liquid Widget]
    J -->|Theme App Snippet| K[Storefront Buyer Experience]
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: v20.x or v22.x LTS
- **npm** or **pnpm**

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/pushkarpypi/List-Guard.git
   cd List-Guard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your API keys (Shopify App Credentials, Supabase, Google Gemini API).

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

5. **Run tests:**
   ```bash
   npm test
   ```

6. **Build for production:**
   ```bash
   npm run build
   ```

---

## 🛍️ Shopify Integration

List Guard is architected to operate as a standalone SaaS dashboard or an embedded Shopify Admin App.

### Required OAuth Scopes:
- `read_products`: To scan listing titles, descriptions, variants, and tags.
- `write_products`: To apply 1-click legal disclosure fixes and manage `listguard` metafields.
- `read_shipping`: To verify fulfillment profiles and international shipping zones.

### Webhook Subscriptions:
List Guard listens to the following topics:
- `products/create` — Audits newly published products in real-time.
- `products/update` — Re-scans updated catalog items to ensure compliance is maintained.
- `app/uninstalled` — Performs GDPR-compliant credential deletion.

---

## 🔐 Zero-Cloud-Footprint Privacy

Unlike traditional enterprise compliance platforms that ingest and store your entire catalog on third-party servers:
- **Client-Side AES-GCM (256-bit) Encryption:** All cached scan results, compliance scores, and listing snippets are encrypted directly in the merchant's browser session via WebCrypto IndexedDB.
- **Zero Catalog Retention:** Scanned product data is processed ephemerally in serverless edge runtimes and immediately discarded.
- **HMAC & Constant-Time Verification:** All webhooks from Shopify and Paddle are validated using `crypto.timingSafeEqual` against SHA-256 HMAC signatures to prevent spoofing and timing attacks.

---

## 📦 Tech Stack

- **Framework:** [Next.js 16.2](https://nextjs.org/) (App Router, Turbopack, Server Actions, `proxy.ts`)
- **Frontend:** [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/), [Base UI](https://base-ui.com/)
- **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security & real-time triggers)
- **AI Engine:** [Google Gemini 1.5 Flash & Pro](https://deepmind.google/technologies/gemini/)
- **Billing Engine:** [Paddle v2](https://www.paddle.com/)
- **Testing:** [Vitest](https://vitest.dev/)

---

## 📄 License & Disclaimer

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

> [!NOTE]  
> **Legal Disclaimer:** List Guard is an automated compliance auditing tool and technical assistant. It does not constitute formal legal counsel. Merchants are advised to consult with certified international trade attorneys or designated EU Authorised Representatives for formal regulatory certifications.
