# Current State

## Stack

- Next.js App Router on Next `^16.2.10`
- React `^19.2.7`
- TypeScript `^6.0.3`
- `@coveo/headless` `^3.4.1`
- Vitest, React Testing Library, Playwright, and axe
- Webpack-based Next commands because of a known Coveo Headless bundle warning

## Active Architecture

```text
RoboMotion Product Discovery -> @coveo/headless/commerce -> Coveo Commerce API
AI Product Guidance -> RGA
Technical Resources -> Search API
```

Active routes:

- `src/app/page.tsx`
- `src/app/catalog/page.tsx`
- `src/app/blog/page.tsx` (Technical Resources / blog index page)
- `src/app/blog/[id]/page.tsx` (Technical Resources article detail page)
- `src/app/api/search-token/route.ts`
- `src/app/api/coveo/generative/answer/route.ts`
- `src/app/api/coveo/content/search/route.ts`

Active Commerce composition:

- `src/components/commerce/ProductDiscoveryExperience.tsx`
- `src/features/commerce/headless/use-headless-commerce.ts`
- `src/features/commerce/headless/headless-commerce-mappers.ts`
- `src/features/commerce/models/commerce-models.ts`
- `src/features/commerce/config/commerce-config.ts`

Shared UI retained by Commerce:

- `src/components/search/SearchBox.tsx`
- `src/components/search/SearchSuggestions.tsx`
- `src/components/search/Pagination.tsx`

## Auth

Anonymous mode is validated live. It uses only `NEXT_PUBLIC_COVEO_ANONYMOUS_SEARCH_API_KEY` in browser-side Headless Commerce.

Search-token mode remains supported through `/api/search-token` and uses only `COVEO_AUTHENTICATED_SEARCH_API_KEY` server-side.

`COVEO_PLATFORM_API_KEY` remains server-only for RGA and Technical Resources.

There is no silent fallback between credentials or provider paths.

## Confirmed Commerce Behavior

- `/` is a search entry page with Headless Commerce query suggestions and popular search links.
- `/catalog` owns the live Headless Commerce product discovery workflow.
- `welding arm` returns 226 products.
- Query suggestions work.
- All five Commerce facets work: category, compatible robot series, brand, price, and rating.
- Price and rating are range facets.
- Pagination works.
- Sorting is relevance-only.
- Headless Commerce requests return HTTP 200.
- `/api/search-token` is not used in anonymous mode.

## Product UI Boundaries

The UI renders confirmed product fields: ID, name, descriptions, brand, category, image, price, promo price, stock, rating, item group, product URL, compatible robot series, compatible robots, compatible joints, and compatible part SKUs.

It does not show payload, reach, precision, mounting type, certification, datasheet, or product recommendation values because those fields are not confirmed structured Commerce data.

## Quality Gates

Available commands:

- `npm run format:check`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:coverage`
- `npm run build`
- `npm run test:e2e`
- `npm run validate`
- `npm run secrets:scan`
- `npm audit`

Local hooks and report-only agent scripts remain available for workflow checks.

## Known Warnings

The Coveo Headless package may emit a Webpack critical-dependency warning during build. It is not an application dynamic import and is documented rather than suppressed.
