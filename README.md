# RoboMotion Product Discovery

Customer-facing industrial robotics product discovery for RoboMotion Industries, built with Next.js App Router, TypeScript, and Coveo Headless Commerce.

## Overview

This project helps manufacturing buyers search a large RoboMotion catalog, narrow results by real Commerce facets, compare products, inspect compatibility, and use technical guidance without mixing content guidance with product ranking.

The home page is a lightweight search entry point. Full live Coveo Commerce product discovery runs at `/catalog`.

## Customer Problem

Industrial robotics buyers rarely know the exact SKU they need at the start of discovery. They need to narrow a large catalog by category, brand, compatible robot series, price, and rating, then compare a small shortlist against application fit, compatibility, stock, and supporting technical resources.

## Key Capabilities

- Live Coveo Commerce product search through `@coveo/headless/commerce`
- Query suggestions
- Hierarchical, regular, and numerical-range facets
- Result summary and data-driven sorting (renders whatever sort criteria the commerce interface config returns — relevance-only today, additional criteria would appear automatically without a code change)
- Pagination
- Product cards with image, price, rating, stock, brand, category, and compatibility
- Local comparison for up to three products
- Product detail drawer with descriptions, images, compatibility, and next actions
- Product detail page (`/products/[id]`, opened in a new tab from a result tile) with gallery, buybox, specs, and compatibility
- AI Product Guidance through RGA
- RGA citations and feedback
- Search API Technical Resources, with an internal `/blog` index page and `/blog/[id]` article detail pages (sanitized full article body, author/date/category/tags, link out to the original source)
- Accessible keyboard and screen-reader behavior
- Responsive layouts across mobile, tablet, and desktop
- App-level analytics plus Headless Commerce analytics
- Vitest, Playwright, axe, secret scanning, audit, and local workflow automation

## Architecture

```text
Next.js UI
├── Headless Commerce
│   ├── Coveo Commerce API
│   └── /products/[id] (product detail page, sessionStorage handoff)
├── Generative Provider
│   └── RGA
└── Content Provider
    ├── Coveo Search API
    ├── /blog (index page)
    └── /blog/[id] (article detail page)
```

The `/` route uses Headless Commerce query suggestions and sends buyers into `/catalog?q=<query>`. Live product search, facets, pagination, summaries, and relevance sorting are handled by Headless Commerce in the browser on `/catalog`. AI Product Guidance and Technical Resources are isolated server-backed paths, not Commerce product recommendation paths. The header's Blog nav link opens `/blog`, a server-rendered index of Technical Resources content reusing the same `searchTrendingContent` provider as the right-rail cards. Clicking a Technical Resources card, or an article on `/blog`, opens `/blog/<id>`, a server-rendered article page built from the same Coveo content result — the external source link moves there instead of leaving the catalog page directly. Clicking a product tile on `/catalog` opens `/products/<id>` in a new tab; unlike `/blog/[id]`, this page has no server-side data fetch — there is deliberately no product-detail API route, so the tile hands the `ProductResult` it already has in memory to the new tab via sessionStorage. See ADR 0010.

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

Open `http://localhost:3000` for the search entry page or `http://localhost:3000/catalog` for the full product catalog.

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

## Challenges Found & Fixed

- The price range slider filtered on `ec_price`, but product cards, comparison, and the details drawer displayed `ec_promo_price` (`promoPrice ?? price`) when a promo price existed. Coveo's Commerce numeric facet correctly constrained results to `ec_price` within the selected range, but items whose `ec_promo_price` fell outside that range still appeared, because the number shown on screen came from a field the slider never filtered. Verified by setting the price max to £2,806 and observing results priced at £3,450/£3,850 — both had an `ec_price` inside the selected range and a higher `ec_promo_price`. Since the price facet's field is generated by Coveo's Merchandising Hub commerce config (the same platform-config boundary as the relevance-only sort below) and can't be retargeted to `ec_promo_price` from the frontend, the fix was to make the displayed price consistent with the filtered field: `ProductResultCard`, `ComparisonBar`, `ComparisonDrawer`, and `ProductDetailsDrawer` now show `product.price` (`ec_price`) instead of preferring `promoPrice`.

## Known Limitations

- Live sorting is relevance-only: verified directly against the raw `/commerce/v2/search` response (`sort.availableSorts` returns only `{sortCriteria: "relevance"}`), so this is a Merchandising Hub interface-config gap, not a frontend gap — the toolbar's sort control is already data-driven (`mapHeadlessSort()`/`updateSort()`, see ADR 0011) and renders a `<select>` the moment more than one criterion is configured; it falls back to a read-only "Relevance" label only because that's the only option offered today. In a live engagement I'd enable field sorting for `ec_price`/`ec_rating` on the commerce listing config; no frontend change would be needed to pick it up.
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
- Configure Commerce sorting beyond relevance on the Merchandising Hub side — the frontend already renders whatever criteria are returned.
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
