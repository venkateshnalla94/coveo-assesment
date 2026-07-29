# ADR 0014: Server-Rendered Product Detail Page via a Narrow Single-Document Lookup

## Status

Accepted (supersedes ADR 0010)

## Context

ADR 0010 built the Product Detail Page (PDP) around a browser `sessionStorage` handoff: the result tile stashed the `ProductResult` it already held, opened `/products/<id>` in a new tab, and `ProductDetailClient` read it back — with no server fetch. That kept the PDP inside the client-only Commerce boundary, but it accepted a real limitation spelled out in ADR 0010's own consequences: the PDP "only works when reached from a product tile in the same browser session; it is not a stable, bookmarkable, or shareable URL." A direct visit, a refresh after the tab's session storage cleared, or a crawler all fell through to the "Product details unavailable" empty state. The page could also only ever show the Commerce-listing subset of fields the tile carried — not the richer engineering specs, per-region availability, review counts, or cross-sell SKUs that the full indexed record holds.

ADR 0010 rejected a server fetch on the grounds that it would introduce "a new server-side Coveo call path outside the two documented exceptions in `CLAUDE.md`." Since then, `CLAUDE.md`'s boundary has been articulated more precisely: the constraint is not "no server-side Coveo call ever," but "no general search proxy, and never expose `COVEO_PLATFORM_API_KEY` to the client." The `/blog/[id]` page already fetches a single content item server-side by exact id via `fetchTrendingArticle` (`src/lib/coveo/content-search.ts`) under that same rule. A single-product lookup by exact id fits the same narrow shape, which reframes the trade-off ADR 0010 made.

## Decision

- `/products/[id]` (`src/app/products/[id]/page.tsx`) now resolves the product server-side via `fetchProductDetail(id)` (`src/lib/coveo/product-detail.ts`) and passes the resolved `ProductDetail` into `ProductDetailClient`. The route stays `force-dynamic`.
- `fetchProductDetail` is a narrow, single-document lookup: it queries the Coveo Search API for one result matching `(@permanentid=="<id>") OR (@ec_product_id=="<id>")` using the server-only `COVEO_PLATFORM_API_KEY`, mirroring the blog article path. It is not a general search proxy.
- The client-controlled route id is escaped before it is interpolated into the query expression, and the function returns `undefined` (never throws) on a miss, a non-ok response, an upstream error, or missing config — so the page degrades gracefully rather than surfacing a server error.
- `ProductDetailClient` is now server-first: it prefers the server-resolved product, falls back to the `sessionStorage` handoff (retained from ADR 0010) when the server lookup misses — e.g. an id that isn't a permanentid — and renders the "Product details unavailable" empty state when neither has it.
- `ProductDetailView` renders the richer sections (Specifications, Availability, Recommended & compatible parts, plus review count / SKU / country-of-origin) only when the server payload supplies them; a plain `ProductResult` from the `sessionStorage` fallback simply omits those sections.
- A `ProductViewAnalytics` component emits a single `product_view` event on mount through the existing `CoveoAnalyticsProvider` bus, gated by the analytics feature flag.

### Rejected alternatives

- **Keep the ADR 0010 `sessionStorage`-only handoff**: simplest, and it required no server-side Coveo call, but it left the PDP non-linkable, non-refreshable, non-crawlable, and limited to the tile's field subset — the exact limitation ADR 0010 flagged as revisitable "if a future need arises for a PDP reachable via direct link." That need is now in scope.
- **A dedicated `/api/coveo/commerce/product/[id]` route**: would expose the single-document lookup as a general HTTP endpoint the browser could call, widening the surface toward a search proxy for no benefit here — the only caller is the server component itself, so a server-only `lib` function (like `content-search.ts`) is the tighter fit.
- **Re-running the browser Commerce search-token flow for one item**: would duplicate the client-side Commerce entry point just to re-fetch a single product and still could not enrich beyond the listing payload.

## Consequences

- The PDP is now linkable, refreshable, and crawlable, and shows comprehensive product detail beyond the Commerce listing subset.
- A new server-side Coveo call path exists, but it stays within the `CLAUDE.md` boundary: server-only `COVEO_PLATFORM_API_KEY`, one document by exact id, no client exposure, not a general proxy. `docs/security-review.md` records the escaping and graceful-degradation controls.
- The `sessionStorage` handoff from ADR 0010 is not removed; it is demoted to a fallback that keeps in-session navigation working when the server lookup can't resolve the id.
- When Coveo config is absent or the lookup fails, the page still returns 200 and renders the empty state, matching the honest zero-config framing used elsewhere.
- ADR 0010 is superseded; its "not bookmarkable/shareable" consequence no longer holds.
