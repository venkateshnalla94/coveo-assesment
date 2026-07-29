# Runtime Flow: What Actually Fires, In Order

This is a narrative trace of what happens as a user moves through the app — which engine,
controller, or API route fires at each step, and in what order. `outputs/architecture/` has the
authoritative per-section Mermaid diagrams (agent-maintained, current-state snapshots); this doc
is the human-readable walkthrough for demo prep and onboarding, written once and updated by hand
when the flow itself changes.

Headline answer up front: **no Headless engine exists until something actually needs one.**
Landing on `/` builds zero engines. The two places an engine gets built are (1) the first
keystroke in the header search box, and (2) mounting `/catalog`. They are two *different* engine
instances, built by two different hooks, that never talk to each other — that's intentional, not
an oversight (see "Two separate Commerce engines" below).

## 1. Landing on `/` (home page)

`src/app/page.tsx` is a plain server component. It resolves runtime config and the commerce auth
mode server-side, then renders `Header` + `HomeHero` + `Footer`. No Coveo call happens yet —
`Header` mounts in its **default search mode** (no `search` override prop supplied), so it renders
a blank, uncommitted `SearchBox` backed by local `useState`, not a live query.

`AgentMountpoint` (mounted once, globally, in `src/app/layout.tsx`) also renders here — it shows
the floating "Ask RoboMotion" launcher, but `ConversationalAgent` returns `null` for its panel
until clicked. No Search Agent API call happens on page load.

**Nothing has called Coveo yet.**

## 2. Typing in the header search box (still on `/`, or any non-catalog page)

`Header`'s default-mode `provider` is `useGlobalSearchSuggestions` (`use-global-search-suggestions.ts`).
This hook is deliberately lazy:

```
controllersRef.current ??= createGlobalSuggestionControllers(authConfig);
```

The **first keystroke** that calls `getSuggestions` is what triggers `buildCommerceEngine` for the
first time in the session — not component mount. That call resolves auth (anonymous key or a
`/api/search-token` fetch), builds a Commerce engine, and builds `search` + `searchBox` controllers
purely to drive query suggestions. This engine is never used for anything else — no facets, no
product list, no analytics beyond suggestion telemetry.

Submitting (Enter, or clicking a suggestion) in default mode calls `router.push("/catalog?q=...")`
— a plain Next.js navigation, not a controller action.

## 3. Landing on `/catalog`

`src/app/catalog/page.tsx` (server component) resolves the initial query from `?q=` (or the
`welding arm` default) and renders `ProductDiscoveryExperience`, passing the resolved auth config
and initial query as props.

`ProductDiscoveryExperience` → `useHeadlessCommerce` (`use-headless-commerce.ts`) is where the
**real** product-search engine is built — eagerly, in a `useEffect` that runs on mount, not lazily
on first interaction like the header's suggestion engine:

1. Resolve auth (anonymous key, or mint/fetch a search token).
2. `buildCommerceEngine` with `analytics.enabled: true`, static `context` (country/currency/
   language/`view.url`).
3. Build controllers off that one engine: `search`, `searchBox`, `pagination`, `summary`, `sort`,
   `facetGenerator`, `didYouMean`.
4. `analytics?.attachRelay(bundle.engine.relay)` — wires the engine's own Relay client into the
   app's `Analytics` context so app-level events (compare, quick view, CTA clicks) land in the same
   event stream as Headless's native search/facet/click events.
5. `searchBox.updateText(initialQuery)` then `searchBox.submit()` — the first real product search
   request fires here.
6. `engine.subscribe(...)` — every subsequent controller state change re-renders the page via a
   debounced `setSnapshot`.

`Header` is rendered again on this page, but this time **with a `search` override** built from the
`commerce` bundle (`query`, `provider: commerce.suggestionsProvider`, `onSubmit`, `onQueryChange`,
`onClear`, `isLoading`). Because an override is supplied, `SearchBox` inside `Header` is now wired
directly to `/catalog`'s own commerce engine — typing, submitting, and clearing all call methods on
*this* engine's `searchBox` controller, not the separate suggestions-only engine from step 2.

### Two separate Commerce engines — why that's fine

If a user types in the header search box on `/`, then navigates to `/catalog`, the suggestions
engine from step 2 is simply abandoned (no explicit teardown — it's component-scoped to `Header`'s
default mode and gets garbage collected once `Header` re-renders with an override). `/catalog`
builds its own engine from scratch. They never share state, tokens are refetched independently,
and each has its own Relay client. This mirrors how a production storefront would structure it:
suggestions are a lightweight, page-agnostic concern; full product search state belongs to the
page that owns the result grid.

"Its own Relay client" means a separate in-memory instance, not a separate analytics identity:
`@coveo/relay` persists the visitor UUID in a `visitorId` cookie (`clientIdKey` in
`relay.mjs`), generating it once and reusing it on every subsequent read. So the suggestions
engine's Relay client and `/catalog`'s Relay client — despite being different objects with
independently refetched tokens — emit events under the same `visitorId`, which is what lets
Coveo's ML/ART stitch them into one visitor session.

## 4. Interacting with facets, sort, pagination, clear (on `/catalog`)

Every one of these is a **controller method call on the same engine built in step 3** — no new
engine, no new auth resolution:

- Facet toggle (`ProductFacetPanel` → `toggleFacetValue`/`toggleRange`) → finds the matching
  controller in `facetGenerator.facets` and calls `.toggleSelect()` / `.setRanges()`.
- Sort (`updateSort`) → `sort.sortBy(criterion)`.
- Pagination (`Pagination` → `selectPage`) → `pagination.selectPage(page)`.
- Clear all / clear one facet → `facetGenerator.deselectAll()` or the matching facet's
  `.deselectAll()`.

Each of these mutates engine state → the `engine.subscribe` callback fires → `readCommerceSnapshot`
rebuilds the UI-facing `ProductSearchResponse` → React re-renders `ProductGrid`/`ProductFacetPanel`/
`Pagination`/`ProductStatus` from the new snapshot. The engine itself is never rebuilt after step 3
for the lifetime of the `/catalog` mount.

## 5. Clicking a product

Two paths exist, and only one of them is instrumented at the *point of intent* (see the click-
tracking fix made earlier in this thread):

- **Quick View** (`onOpenDetails` → `openDetails`) calls `analytics.track("product_details_opened")`
  **and** `commerce.trackProductClick(product.id)`, which calls
  `bundle.search.interactiveProduct({ options: { product } }).select()` — the Commerce-engine
  equivalent of `logDocumentOpen`, feeding Coveo's click-through/ART signal.
- **Card title/image click** (`ProductResultCard` → `openInNewTab`) now also calls
  `onProductClick`/`trackProductClick` before `storeProductForPdp(product)` writes the full
  `ProductResult` to `sessionStorage['pdp-product:<id>']` and `window.open('/products/<id>', '_blank')`
  opens the PDP.
- The details drawer's "View Product" external link also fires `trackProductClick` on click.

`/products/[id]` (`src/app/products/[id]/page.tsx` + `ProductDetailClient`) **builds no Headless
engine**. It resolves the product server-side via `fetchProductDetail(id)`
(`src/lib/coveo/product-detail.ts`) — a narrow single-document Search API lookup by exact
`@permanentid`/`@ec_product_id` using the server-only `COVEO_PLATFORM_API_KEY`, escaping the
client-controlled id and returning `undefined` on any miss/failure. `ProductDetailClient` is
server-first, falling back to the `sessionStorage` entry written in the step above when the server
lookup can't resolve the id, and to a "Product details unavailable" empty state when neither has it.
This makes the PDP linkable and refreshable (a bookmarked/shared link now renders the real product
via the server lookup rather than the empty state). See ADR 0014.

## 6. Generative Answer banner (on `/catalog`, alongside the product grid)

This is **not Headless** at all. `GenerativeAnswer` (`components/generative/GenerativeAnswer.tsx`)
watches the committed `query` string; on change, it calls `provider.generate(query)` where
`provider` is `CoveoGenerativeProvider`, which does a plain `fetch` to
`/api/coveo/generative/answer` — a Next.js route that calls Coveo's RGA endpoint server-side using
`COVEO_PLATFORM_API_KEY`. No engine, no controller — just a request/response cycle keyed off the
query state that the Commerce engine happens to own.

## 7. Trending Content rail (also on `/catalog`)

Same pattern as RGA: `ProductRightRail` → `CoveoContentTrendingProvider` → a server route
(`/api/coveo/content/search`) using the same server-only platform key. Keyed off the same `query`,
but again, a fetch, not a Headless engine.

## 8. `/blog` and `/blog/[id]`

Fully server-rendered, `force-dynamic`. `src/lib/coveo/content-search.ts` calls the Coveo Search
API directly server-side (no Headless SDK involved on this path at all — CLAUDE.md calls this out
explicitly as a narrow, non-proxy boundary). `Header` renders here too, in default mode, so typing
in search still lazily builds the *suggestions* Commerce engine from step 2, exactly as it would on
`/`.

## 9. The conversational agent widget (global, every page)

Mounted once in `layout.tsx`, always present as a floating launcher. Nothing fires until the user
clicks it open and sends a message: `ConversationalAgent` → `CoveoConversationProvider.stream(...)`
→ `/api/coveo/conversation`, which calls the Search Agent API (`.../agents/{agentId}/answer`,
AG-UI protocol), server-side, with the platform key. This agent is grounded on blog content only —
not the product catalog — which is why its starter prompts (added earlier) stay scoped to
setup/maintenance/safety topics rather than product-compatibility questions. No Headless engine is
involved anywhere in this path.

## The repeating pattern

Across all of the above, the same shape recurs:

1. A page/component mounts.
2. A **hook** (not the component itself) owns the decision of *when* to build an engine or fire a
   request — either eagerly on mount (`useHeadlessCommerce`) or lazily on first real use
   (`useGlobalSearchSuggestions`).
3. Everything Coveo-shaped (engine, controllers, or a server route) is wrapped by that hook and
   exposes a small, UI-safe API back to the component — the component never touches raw Headless
   controller state or raw Coveo response shapes directly.
4. User actions call methods on that UI-safe API; the hook translates them into controller calls
   (Commerce) or new fetches (RGA/trending/content/conversation).
5. State changes flow back through a subscribe/re-render cycle (Headless) or a promise resolution
   (the fetch-based providers) into local component state, never the other way around.

The one deliberate architectural line: **only the Commerce catalog path uses `@coveo/headless`
itself.** Every other Coveo surface (RGA, trending content, blog Search API, conversational agent)
is a server-side fetch behind a narrow Next.js route using the platform key — not a second Headless
engine. That split is what CLAUDE.md's "do not turn any of these into a full search proxy" boundary
is protecting.
