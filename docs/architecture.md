# Architecture

## Product Discovery

```text
RoboMotion Product Discovery
  -> @coveo/headless/commerce
  -> Coveo Commerce API
```

`src/components/commerce/ProductDiscoveryExperience.tsx` is the active application composition point. It initializes `useHeadlessCommerce`, renders the shared search box, Commerce facets, product grid, pagination, comparison, details drawer, and the right rail.

The Headless Commerce adapter lives in `src/features/commerce/headless/use-headless-commerce.ts`. It builds the Commerce engine, search controller, search box, pagination, summary, relevance sort, and facet generator. It maps Headless products, facets, and pagination into the local Commerce UI model through `headless-commerce-mappers.ts`.

Direct Commerce application proxy routes are not part of the runtime architecture.

## Guidance And Resources

```text
AI Product Guidance -> /api/coveo/generative/answer -> Search API RGA stream
Technical Resources -> /api/coveo/content/search -> Search API
```

The right rail keeps these concerns separate from product search. RGA can explain product evaluation criteria, but it does not select or recommend products. Technical Resources are content results, not Commerce products.

## Authentication

Two modes are supported and must be selected explicitly with `COVEO_AUTH_MODE`.

- `anonymous-api-key`: browser-side Headless Commerce uses only `NEXT_PUBLIC_COVEO_ANONYMOUS_SEARCH_API_KEY`.
- `search-token`: Headless Commerce calls `/api/search-token`, which uses only `COVEO_AUTHENTICATED_SEARCH_API_KEY` server-side to mint short-lived tokens.

There is no fallback between anonymous and search-token credentials.

`COVEO_PLATFORM_API_KEY` is server-only and remains available for RGA and Technical Resources. It is not sent to the browser.

## Runtime Configuration

`src/lib/runtime/runtime-config.ts` resolves:

- environment
- feature flags
- configured auth mode
- non-secret Coveo organization metadata
- whether anonymous and authenticated credentials are configured

It does not resolve runtime profile branches, synthetic scenarios, or sample product data.

## Commerce Surface

Confirmed live behavior:

- `welding arm` returns 226 products.
- Query suggestions work.
- Facets: `ec_category`, `compatible_robot_series`, `ec_brand`, `ec_price`, and `ec_rating`.
- Price and rating are range facets.
- Pagination works.
- Sorting is relevance-only.

The UI renders only confirmed Commerce fields. It does not fabricate payload, reach, precision, mounting, certification, datasheet, or recommendation data.

## Analytics And Logging

Headless Commerce owns Coveo usage analytics through engine configuration. App-level interaction tracking uses `AnalyticsProviderRoot` and must not include tokens, privileged keys, or raw provider payloads.

`ApplicationError`, `ConsoleLogger`, and `NoopLogger` support redacted errors and lightweight operational logging.

## Build Note

The project uses `next dev --webpack` and `next build --webpack`. A Coveo Headless Webpack critical-dependency warning may remain because it comes from the third-party package bundle.
