# ADR 0010: Product Detail Page via SessionStorage Handoff, No Server Fetch

## Status

Accepted

## Context

The assessment's Commerce product search runs entirely client-side against the Coveo Commerce API through `@coveo/headless/commerce` (see `CLAUDE.md`): the only server-side Coveo paths are `/api/search-token` (token minting) and the narrow content/RGA support routes. There is deliberately no general search proxy and no product-detail-by-id API route.

Adding a Product Detail Page (PDP) therefore couldn't follow `/blog/[id]`'s pattern of a Server Component fetching the item directly from Coveo (`fetchTrendingArticle`) — there is no equivalent `fetchProductById` path, and adding one would mean either exposing `COVEO_PLATFORM_API_KEY`-backed product lookup as a new server route (out of scope per `CLAUDE.md`) or duplicating the Commerce search-token flow just to re-run a single-item query. At the same time, the full `ProductResult` for any given product already exists in the browser: it's what `ProductDiscoveryExperience` rendered onto the result tile from the live Commerce search response.

## Decision

- The PDP (`/products/[id]`) is a Server Component route shell (Header/Footer, auth/runtime config resolution, `?q=` propagation per ADR 0009) with no data fetch of its own. It renders `ProductDetailClient`, a Client Component.
- `ProductResultCard` stashes the `ProductResult` it already has into `sessionStorage` (`src/lib/commerce/product-session-cache.ts`, keyed `pdp-product:<id>`) at click time, then opens `/products/<id>` in a new tab.
- The new tab is opened with `window.open(href, "_blank")` from the click handler rather than relying on a plain `<a target="_blank">` navigation. A plain link click does not reliably preserve the `window.opener` relationship in every browser, and same-origin `sessionStorage` inheritance for a new tab depends on that opener relationship (per the HTML spec, a new browsing context only gets a copy of the opener's session storage when it has one). Modifier/middle clicks are left to native browser handling and are not covered by this handoff.
- `ProductDetailClient` reads the cached product back via `useSyncExternalStore`, memoizing the parsed result per id in a module-level `Map` so repeated renders get a stable snapshot reference (required by `useSyncExternalStore`, since a fresh `JSON.parse` each call would never be reference-equal).
- If nothing is cached for the requested id — a direct visit, a reload after the tab's session storage was cleared, or any other cache miss — `ProductDetailClient` renders a "Product details unavailable" empty state with a link back to `/catalog`, rather than attempting any fallback fetch.

### Rejected alternatives

- **Plain `<a target="_blank">` click**: simpler, but does not reliably establish the opener relationship `sessionStorage` inheritance depends on across browsers, defeating the handoff.
- **A new product-detail API route** (e.g. `/api/coveo/commerce/product/[id]`) that re-queries Coveo Commerce server-side: would give the PDP a real fetch path independent of tile state, but introduces a new server-side Coveo call path outside the two documented exceptions in `CLAUDE.md` (search-token minting; narrow content/RGA support), effectively becoming a second Commerce entry point to keep in sync with the client-side flow. Rejected as out of scope for this assessment.

## Consequences

- The PDP only works when reached from a product tile in the same browser session; it is not a stable, bookmarkable, or shareable URL independent of that navigation. This is an accepted trade-off, not a bug — the empty-state fallback makes the failure mode visible instead of silent.
- No new server-side Coveo call path was introduced; the architectural boundary in `CLAUDE.md` (only `/api/search-token` and the narrow content/RGA routes call Coveo directly from the server) remains unchanged.
- The data handed off is same-origin, browser-held `ProductResult` data the user's own session already fetched from Coveo — not attacker-controlled input — so this does not introduce a new trust boundary; it reuses the same `getSafeProductUrl` protocol allowlist as other product links for the one external link the PDP renders.
- If a future need arises for a PDP reachable via direct link (e.g. shared URLs, email), this ADR's approach does not cover that case and a real product-detail fetch path would need to be reconsidered against the architecture boundary above.
