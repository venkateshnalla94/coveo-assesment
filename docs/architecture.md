# Architecture

## System Shape

```text
Next.js UI
├── Headless Commerce
│   ├── Coveo Commerce API
│   └── /products/[id] (product detail page, sessionStorage handoff)
├── Generative Provider
│   └── RGA
├── Content Provider
│   ├── Coveo Search API
│   ├── /blog (index page)
│   └── /blog/[id] (article detail page)
└── Conversational Agent (global floating widget, all pages)
    └── Coveo Search Agent API (agentic RAG, AG-UI protocol)
```

The application is a customer-facing RoboMotion product discovery experience. Product search uses `@coveo/headless/commerce`; AI Product Guidance uses RGA; Technical Resources use the Coveo Search API; the global conversational agent uses the Coveo Search Agent API.

The `/` route is a search entry page. It initializes Headless Commerce query suggestions and navigates into `/catalog?q=<query>` without rendering product listings on the home page.

The last *submitted* search query is carried across pages via the URL's `?q=` param rather than app-level state: `ProductDiscoveryExperience` calls `router.replace` with `?q=<query>` after submitting to Headless Commerce, and the shared `Header` appends `?q=<currentQuery>` onto its Products/Blog nav links whenever a `currentQuery` is available, so navigating away from an active search carries it forward. `Header`/`Footer` are now global singletons rendered once by `src/app/layout.tsx`, not composed per-page: `src/components/layout/AppChrome.tsx` (a Client Component) resolves `currentQuery` for every route client-side from `useSearchParams().get("q")`, and resolves `activePath` from `usePathname()`. `/blog` (a Server Component) still reads `searchParams.q` itself, but only to seed the `searchTrendingContent` query (falling back to the existing hardcoded default when absent) — it no longer resolves a `Header currentQuery` since it no longer renders `Header` at all. This is a UI-navigation convenience only — it does not couple the Commerce and content search domains described below. See ADR 0009 and ADR 0013.

## Headless Commerce Engine Lifecycle

`src/app/catalog/page.tsx` owns the live product catalog route. `src/components/commerce/ProductDiscoveryExperience.tsx` owns the product discovery page composition and passes the selected auth mode and initial query into `useHeadlessCommerce`.

`src/features/commerce/headless/use-headless-commerce.ts` owns the Headless Commerce lifecycle:

- resolve anonymous or search-token auth
- build the Commerce engine
- configure analytics context
- build the search, search box, pagination, summary, relevance sort, and facet generator controllers
- submit the initial catalog query, defaulting to `welding arm`
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

## Product Detail Page

`/products/[id]` (`src/app/products/[id]/page.tsx`) is a Server Component shell — route resolution only, no `Header`/`Footer` (those are rendered once, globally, by `src/app/layout.tsx`; see ADR 0013) — that renders `ProductDetailClient`, a Client Component, with no server-side Coveo fetch. This differs from `/blog/[id]`, which fetches its content server-side: there is deliberately no product-detail API route (per this repo's architecture, Commerce product search stays client-side against Coveo directly), so the page instead reads the `ProductResult` the result tile already held in memory from the live Commerce search response.

`ProductResultCard` writes that `ProductResult` into `sessionStorage` (`src/lib/commerce/product-session-cache.ts`, keyed by product id) and opens `/products/<id>` with `window.open()` rather than a plain link click, so the new tab reliably inherits an opener relationship and, with it, same-origin `sessionStorage`. `ProductDetailClient` reads it back via `useSyncExternalStore`, memoizing the parsed snapshot per id in a module-level cache so the store returns a stable reference across renders. A direct visit, an expired tab, or an untouched `sessionStorage` origin renders the client component's own "Product details unavailable" empty state rather than failing silently. See ADR 0010.

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
                                                    (shared) src/lib/coveo/content-search.ts
/blog (Server Component) -------------------------> searchTrendingContent ---> Coveo Search API
/blog/[id] (Server Component) -----------------> fetchTrendingArticle -------> Coveo Search API
```

`src/lib/coveo/content-search.ts` centralizes both Coveo content calls: `searchTrendingContent` (list results for the right-rail cards and the `/blog` index page, no article body) and `fetchTrendingArticle` (a single result looked up by `raw.permanentid`, including the full article body). The route handler, the `/blog` Server Component, and the `/blog/[id]` Server Component all call this module directly — none of these pages fetch their own API route over HTTP.

The full article body (`raw.content`/`raw.body`) is untrusted third-party HTML from the external blog source. `fetchTrendingArticle` sanitizes it server-side with `sanitize-html` (allowlisted tags/attributes, forced `target="_blank" rel="noopener noreferrer"` on links) before it is ever sent to the client — this is the security boundary for rendering it with `dangerouslySetInnerHTML` on the article page. List results never include the body field, keeping the right-rail card payload small.

Trending cards link internally to `/blog/{id}` (the article's `permanentid`, not a product SKU) instead of opening the external source directly; the article page itself carries a "View original source" link out, reusing the existing `getSafeTrendingUrl` protocol allowlist. See ADR 0007.

Both are isolated from product search. If RGA or resources fail, product discovery remains usable. RGA guidance is blog/content-grounded research support, not product recommendation.

## Conversational Search Agent

A floating chat widget (`AgentLauncher`/`AgentPanel`, mounted by `AgentMountpoint` in `src/app/layout.tsx`) is global — it renders as a sibling of `{children}` on every page, not inside any one route tree — and is gated by the `COVEO_FEATURE_CONVERSATION_ENABLED` flag (default off).

```text
ConversationalAgent -> CoveoConversationProvider -> /api/coveo/conversation -> Coveo Search Agent API
                                                      (server-only COVEO_PLATFORM_API_KEY)
```

This is a distinct upstream from RGA and Technical Resources: the Search Agent API (`{orgId}.org.coveo.com/api/v1/organizations/{orgId}/agents/{agentId}/answer` and `/follow-up`, agentic RAG over the AG-UI protocol) rather than the Search API (`platform-eu.cloud.coveo.com/rest/search/v2`). `src/app/api/coveo/conversation/route.ts` shares the same server-only-`COVEO_PLATFORM_API_KEY` boundary as the RGA/content routes but shares no code with them — `src/lib/coveo/search-agent-api.ts` builds the Search Agent URLs and `src/lib/coveo/ag-ui-stream.ts` re-encodes the upstream AG-UI SSE event stream (`RUN_STARTED`/`STEP_STARTED`/`TEXT_MESSAGE_CHUNK`/`RUN_FINISHED`/`RUN_ERROR`/citation `CUSTOM` events) into this app's own smaller `step`/`token`/`citations`/`done`/`no-answer`/`error` SSE contract before it reaches the browser.

`CoveoConversationProvider` (mirroring the `GenerativeProvider` abstraction in ADR 0003) consumes that contract client-side and drives a `useReducer` conversation state machine; a `mock-conversation-provider.ts` exists for deterministic tests. `AgentContextProvider` publishes the current page's `PageContext` (kind, title, id, query) via two split React contexts so PDP/blog pages can enrich what the agent knows about the page the buyer is on, without making the globally-mounted agent a parent of `children`.

Answer text is untrusted model output rendered with `react-markdown` (`AgentMessage.tsx`) — no `rehype-raw` plugin is wired in, so raw HTML in the answer is never rendered, only markdown syntax; the only added surface is forcing answer-body links to open with safe `target="_blank" rel="noreferrer"`.

The agent is isolated from product search and Technical Resources the same way RGA is: it fails independently (visible in-panel error state) and never blocks or alters product discovery, facets, pagination, or Technical Resources.

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

- Vitest covers mappers, runtime configuration, auth boundaries, UI components, RGA, resources (including the Coveo content mapping and HTML sanitization in `src/lib/coveo/content-search.ts`), analytics, logging, and security helpers.
- Playwright covers live product discovery, suggestions, facets, pagination, comparison, product details, failure isolation, keyboard behavior, responsive behavior, and axe accessibility checks.
- Secret scanning checks committed files for obvious credential leaks.
- `npm audit` checks dependency advisories.

## Known Build Warning

Next runs with Webpack. Coveo Headless currently emits a Webpack critical-dependency warning from its package bundle. The warning is documented and not hidden.
