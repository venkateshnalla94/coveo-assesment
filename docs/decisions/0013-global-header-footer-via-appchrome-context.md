# ADR 0013: Global `Header`/`Footer` via a Root-Layout `AppChrome` and Split Search-Override Context

## Status

Accepted (supersedes the `Header`/blog-page mechanics described in ADR 0009's Decision section; ADR 0009's core "URL is the carrier" decision is unchanged)

## Context

Prior to this change, every page composed its own chrome: `src/app/page.tsx`, `src/app/catalog/page.tsx`, `src/app/products/[id]/page.tsx`, `src/app/blog/page.tsx`, and `src/app/blog/[id]/page.tsx` (plus its `not-found.tsx`) each called `resolveRuntimeConfig()` and `resolveHeadlessCommerceAuthConfig()` themselves, rendered their own `<Header>`/`<Footer>`, and — per ADR 0009 — the two Server Component blog pages read `searchParams.q` server-side to resolve `Header`'s `currentQuery` prop, while `ProductDiscoveryExperience` passed its live search wiring (`query`, `onSubmit`, `onQueryChange`, suggestions provider, loading state) directly as a `Header` prop since it was the one rendering `Header` on `/catalog`.

This duplicated the same auth-config resolution and chrome composition five times, and made `Header`'s live-search "override" mode reachable only because `ProductDiscoveryExperience` happened to be the component rendering `Header` — any future page wanting the same live-search affordance would need to render `Header` itself too, re-deriving `activePath`/`currentQuery` in the process.

Introducing a single global `Header`/`Footer` in `src/app/layout.tsx` removes the duplication, but creates a new problem: `Header` needs `activePath`, `currentQuery`, and an optional live-search override, none of which the root layout can compute itself (`activePath`/`currentQuery` depend on the current route, which only a Client Component can read via `usePathname()`/`useSearchParams()`; the live-search override is owned by whichever route currently has an active Headless engine, today only `/catalog`). A single combined React Context (value + setter together) was considered and rejected: `usePublishHeaderSearch`'s effect has no dependency array (the override's callbacks aren't referentially stable across renders), so if the context's value changed on every publish, the effect's own component would re-render, re-run the effect, and re-publish — an unconditional infinite loop.

## Decision

- Add `src/components/layout/AppChrome.tsx`, a Client Component mounted once in `src/app/layout.tsx` (inside a `Suspense` boundary, since it calls `useSearchParams()`). It derives `activePath` from `usePathname()` (`/blog*` → `/blog`, `/catalog*`/`/products*` → `/catalog`, else `/`) and `currentQuery` from `useSearchParams().get("q")`, and renders the single `Header` instance for every route.
- Add `src/components/layout/header-search-context.tsx`, split into two contexts on purpose: `HeaderSearchValueContext` (read by `AppChrome` via `useHeaderSearchOverride`) and `HeaderSearchSetterContext` (read by route owners via `usePublishHeaderSearch`, which subscribes only to the setter — stable for the provider's lifetime — never to the value). This split is what avoids the infinite-loop failure mode described above.
- `src/app/layout.tsx` now resolves `resolveRuntimeConfig()`/`resolveHeadlessCommerceAuthConfig()` once, centrally, and renders `<HeaderSearchProvider><AppChrome authConfig={...} />{children}</HeaderSearchProvider><Footer />` wrapping every page's content, instead of each page composing its own chrome.
- `src/app/page.tsx`, `src/app/catalog/page.tsx`, `src/app/products/[id]/page.tsx`, `src/app/blog/page.tsx`, `src/app/blog/[id]/page.tsx`, and its `not-found.tsx` no longer render `Header`/`Footer`, resolve auth config, or (for the blog pages) resolve a `Header currentQuery` — they render only their own `<main>` content.
- `ProductDiscoveryExperience` no longer renders `Header` itself; it calls `usePublishHeaderSearch({...})` with its live query/submit/suggestions/loading/clear wiring, which `AppChrome` picks up via context and passes to `Header` as the `search` prop. The hook re-publishes unconditionally on every render (cheap next to the commerce engine's own re-render cadence) and clears the override on unmount, so navigating away from `/catalog` reverts `Header` to its default (uncontrolled `SearchBox` state) mode.
- `Header`'s previously file-local `HeaderSearchOverride` type is now exported, since the context module's write-hook signature needs it.

## Consequences

- `Header`/`Footer` are true singletons — one mount per page load, not re-created per route — and every page is relieved of resolving its own auth config or chrome.
- `currentQuery` resolution moved from server-side per-page (`searchParams.q` on the two blog Server Components, per ADR 0009) to client-side, centrally, in `AppChrome`. The URL remains the carrier (ADR 0009's core decision is unchanged); only which layer reads `?q=` for `Header`'s benefit changed. `/blog` still reads `searchParams.q` server-side for its own purpose — seeding the `searchTrendingContent` query — that part of ADR 0009 is unaffected.
- The live-search override is now reachable by any future route, not just whichever one happens to render `Header`: a page just calls `usePublishHeaderSearch(...)`. Today only `/catalog` does.
- The two-context split is a real constraint on future changes to this module: adding fields to a single combined context, or having `usePublishHeaderSearch` read the value context for any reason, reintroduces the infinite-loop failure mode this ADR exists to avoid.
- `not-found.tsx` under `/blog/[id]` no longer needs the "unpropagated `currentQuery`" carve-out ADR 0009 called out, since it no longer resolves `currentQuery` (or renders `Header`) at all — the root layout's `Header` renders around it like any other route.
