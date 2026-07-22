# Architecture

## System Shape

```text
Next.js UI
├── Headless Commerce
│   └── Coveo Commerce API
├── Generative Provider
│   └── RGA
└── Content Provider
    └── Coveo Search API
```

The application is a customer-facing RoboMotion product discovery experience. Product search uses `@coveo/headless/commerce`; AI Product Guidance uses RGA; Technical Resources use the Coveo Search API.

## Headless Commerce Engine Lifecycle

`src/components/commerce/ProductDiscoveryExperience.tsx` owns the product discovery page composition. It passes the selected auth mode into `useHeadlessCommerce`.

`src/features/commerce/headless/use-headless-commerce.ts` owns the Headless Commerce lifecycle:

- resolve anonymous or search-token auth
- build the Commerce engine
- configure analytics context
- build the search, search box, pagination, summary, relevance sort, and facet generator controllers
- submit the initial `welding arm` query
- subscribe to engine state changes
- expose a UI-safe product discovery API

The hook maps Headless state into `ProductSearchResponse` so the UI does not depend on raw controller state shape.

## Controller Ownership

Headless Commerce controllers own:

- product query submission
- query suggestions
- facet selection and deselection
- pagination
- result summary
- relevance sorting
- Commerce analytics emitted by Headless

React owns presentation state:

- comparison shortlist
- comparison drawer visibility
- selected details drawer product
- app-level interaction tracking

This split keeps Coveo search behavior in Headless and keeps purely local UI workflow state in React.

## Product Mapping Boundary

`src/features/commerce/headless/headless-commerce-mappers.ts` maps Headless products, facets, and pagination into local Commerce models.

The UI renders only confirmed structured fields:

- product ID and name
- descriptions
- brand and category
- image
- price and promo price
- rating and stock
- product URL
- item group
- compatible robot series
- compatible robots, joints, and part SKUs

Payload, reach, precision, mounting, certification, industry, controller, and datasheet fields are not rendered as structured specifications because they were not available consistently in the catalog.

## Comparison And Details State

Comparison state is intentionally local. It is a short-lived buyer workflow for selecting up to three visible products, not a persisted cart or account-level list.

The product details drawer also uses local state. It exposes deeper descriptions, images, compatibility, and demo next actions without claiming production CRM integration.

## Authentication

Two explicit auth modes are supported.

Anonymous assessment mode:

- `COVEO_AUTH_MODE=anonymous-api-key`
- browser-side Headless Commerce uses `NEXT_PUBLIC_COVEO_ANONYMOUS_SEARCH_API_KEY`
- `/api/search-token` is not used

Secured production mode:

- `COVEO_AUTH_MODE=search-token`
- browser calls `/api/search-token`
- server uses `COVEO_AUTHENTICATED_SEARCH_API_KEY`
- Headless Commerce renews tokens through the same route

There is no fallback between credentials. `COVEO_PLATFORM_API_KEY` remains server-only for RGA and Technical Resources.

## RGA And Technical Resources

AI Product Guidance:

```text
Generative UI -> CoveoGenerativeProvider -> /api/coveo/generative/answer -> RGA
```

Technical Resources:

```text
TrendingContent -> CoveoContentTrendingProvider -> /api/coveo/content/search -> Coveo Search API
```

Both are isolated from product search. If RGA or resources fail, product discovery remains usable. RGA guidance is blog/content-grounded research support, not product recommendation.

## Analytics

Headless Commerce owns Coveo usage analytics through the Commerce engine configuration.

The app also uses `AnalyticsProviderRoot` for interaction events such as search submission, facet selection, comparison, details drawer opens, and CTA clicks. App analytics payloads must not include tokens, privileged keys, or raw provider payloads.

## Accessibility

The UI is built around semantic controls:

- search input uses combobox behavior for suggestions
- product filters are grouped in a complementary landmark
- pagination uses navigation semantics
- dialogs use accessible names and close controls
- loading and error states use status/alert semantics
- keyboard navigation is covered by Playwright

## Error Isolation

Product search initialization errors render as visible product-search errors. There is no silent fallback to removed provider paths.

RGA and Technical Resources fail independently in the right rail. Their failures do not block products, facets, pagination, comparison, or details.

Server routes redact credential and upstream details before returning errors to the browser.

## Test Layers

- Vitest covers mappers, runtime configuration, auth boundaries, UI components, RGA, resources, analytics, logging, and security helpers.
- Playwright covers live product discovery, suggestions, facets, pagination, comparison, product details, failure isolation, keyboard behavior, responsive behavior, and axe accessibility checks.
- Secret scanning checks committed files for obvious credential leaks.
- `npm audit` checks dependency advisories.

## Known Build Warning

Next runs with Webpack. Coveo Headless currently emits a Webpack critical-dependency warning from its package bundle. The warning is documented and not hidden.
