# RoboMotion Product Discovery

Customer-facing industrial robotics product discovery for RoboMotion Industries, built with Next.js App Router, TypeScript, and Coveo Headless Commerce.

## Overview

This project helps manufacturing buyers search a large RoboMotion catalog, narrow results by real Commerce facets, compare products, inspect compatibility, and use technical guidance without mixing content guidance with product ranking.

## Customer Problem

Industrial robotics buyers rarely know the exact SKU they need at the start of discovery. They need to narrow a large catalog by category, brand, compatible robot series, price, and rating, then compare a small shortlist against application fit, compatibility, stock, and supporting technical resources.

## Key Capabilities

- Live Coveo Commerce product search through `@coveo/headless/commerce`
- Query suggestions
- Hierarchical, regular, and numerical-range facets
- Result summary and relevance-only sorting
- Pagination
- Product cards with image, price, rating, stock, brand, category, and compatibility
- Local comparison for up to three products
- Product detail drawer with descriptions, images, compatibility, and next actions
- AI Product Guidance through RGA
- RGA citations and feedback
- Search API Technical Resources
- Accessible keyboard and screen-reader behavior
- Responsive layouts across mobile, tablet, and desktop
- App-level analytics plus Headless Commerce analytics
- Vitest, Playwright, axe, secret scanning, audit, and local workflow automation

## Architecture

```text
Next.js UI
├── Headless Commerce
│   └── Coveo Commerce API
├── Generative Provider
│   └── RGA
└── Content Provider
    └── Coveo Search API
```

Product search, suggestions, facets, pagination, summaries, and relevance sorting are handled by Headless Commerce in the browser. AI Product Guidance and Technical Resources are isolated server-backed paths, not Commerce product recommendation paths.

## Authentication

Anonymous assessment mode:

```bash
COVEO_AUTH_MODE=anonymous-api-key
NEXT_PUBLIC_COVEO_ANONYMOUS_SEARCH_API_KEY=
```

Secured production mode:

```bash
COVEO_AUTH_MODE=search-token
COVEO_AUTHENTICATED_SEARCH_API_KEY=
```

In secured mode, `/api/search-token` mints short-lived tokens using the server-only authenticated search key.

There is no credential fallback. Anonymous mode uses only `NEXT_PUBLIC_COVEO_ANONYMOUS_SEARCH_API_KEY`; search-token mode uses only `COVEO_AUTHENTICATED_SEARCH_API_KEY`. `COVEO_PLATFORM_API_KEY` remains server-only for RGA and Technical Resources.

## Setup

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Required baseline environment:

```bash
COVEO_ORGANIZATION_ID=
COVEO_AUTH_MODE=anonymous-api-key
NEXT_PUBLIC_COVEO_ANONYMOUS_SEARCH_API_KEY=
COVEO_PLATFORM_API_KEY=
```

## Validation

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run build
npm run test:e2e
npm run validate
npm run secrets:scan
npm audit
```

`npm run validate` runs format, lint, typecheck, coverage, and build. Playwright E2E and `npm audit` are run separately for final submission readiness.

## Known Limitations

- Live sorting is relevance-only because the validated Commerce response exposes only relevance sorting.
- Payload, reach, precision, mounting, certification, industry, controller, and datasheet fields are not available as consistent structured catalog fields.
- RGA is grounded in blog/content material and is not a product recommendation engine.
- Commerce Product Recommendations and Product Listings are not configured.
- Contact Sales and Request Quote are demo interactions unless connected to production CRM or commerce workflows.
- Coveo Headless emits a Webpack critical-dependency warning from the third-party bundle.
- The `sharp` override should be revisited with future Next releases.

## What I Would Improve With More Time

- Normalize manufacturing specifications into indexed fields.
- Add payload, reach, certification, mounting, industry, and controller facets once structured data exists.
- Connect Contact Sales and Request Quote to production CTA systems.
- Implement secured identity-aware search for authenticated customers.
- Add analytics dashboards and conversion reporting.
- Add personalization after governance and consent requirements are clear.
- Configure Commerce sorting beyond relevance when the index supports it.
- Add product recommendations when Coveo recommendations are enabled.
- Deploy Web Vitals monitoring.

## Documentation

- `docs/architecture.md`
- `docs/demo-script.md`
- `docs/interview-notes.md`
- `docs/demo-readiness-report.md`
- `docs/submission-checklist.md`
- `docs/testing-strategy.md`
- `docs/security-review.md`
