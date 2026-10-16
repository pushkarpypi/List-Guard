# Contributing to List Guard

Thank you for your interest in contributing to List Guard! We welcome contributions from developers, compliance officers, and e-commerce merchants.

## Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free experience for everyone. Please be respectful and constructive in all discussions.

## How Can I Contribute?

### 1. Reporting Bugs
- Check the GitHub Issues tab to ensure the bug hasn't already been reported.
- Open a new issue with a clear descriptive title.
- Include reproduction steps, your Node/browser version, and expected vs. actual behavior.

### 2. Suggesting Regulatory Rules or Features
- As trade regulations evolve (GPSR amendments, OEHHA Prop 65 updates, customs tariff changes), new rule engines can be proposed.
- Open an issue detailing the legal mandate, statutory references, affected product categories, and recommended disclaimer text.

### 3. Pull Requests
1. Fork the repo and create your branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Make your changes and ensure all tests pass:
   ```bash
   npm test
   ```
4. Run the production build to ensure 100% type safety and Next.js compliance:
   ```bash
   npm run build
   ```
5. Commit your changes following conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`).
6. Push to your fork and submit a Pull Request.

---

## Coding Standards

- **TypeScript:** Strict type checking is required. Avoid using `any` unless wrapping opaque third-party APIs.
- **Component Architecture:** Functional React 19 components using Tailwind CSS v4 utility classes.
- **Security:** Never commit credentials or test keys. Follow constant-time cryptographic verification for all webhooks.
