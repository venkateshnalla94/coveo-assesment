# ADR 0009: Cross-Page Query Propagation via the URL `?q=` Param

## Status

Accepted

## Context

`c4823a26` moved the search box out of individual pages into the shared `Header`, making it a global search bar rendered on `/catalog`, `/blog`, and `/blog/[id]`. That commit made the bar visually global but left each page's search state isolated: submitting a query on `/catalog` had no effect on what the Blog nav link pointed at or what the `/blog` index page rendered, since `ProductDiscoveryExperience` (Commerce Headless state) and the blog pages (independent Server Components) had no shared state.

Coveo Headless already owns search-domain state internally via its own Redux-based engine (one engine per page/route, scoped to that page's search context — Commerce on `/catalog`, content search for the blog pages). Introducing a second, app-level state layer (React Context or Redux) purely to mirror "the last query the user typed" across otherwise-independent Server Components would duplicate state ownership without adding a real capability: Server Components render on the server per request, so client-side Context can't reach `/blog`'s data-fetching without also converting it to a Client Component and losing server rendering, and a client-only store would not survive a reload or support deep-linking `/blog?q=welding` directly.

## Decision

- The last *submitted* (not the live keystroke-by-keystroke) query is carried across pages via the URL's `?q=` search param, not app state.
- `ProductDiscoveryExperience.submitSearch` trims the query, no-ops on empty input, and calls `router.replace(\`/catalog?q=${encodeURIComponent(trimmedQuery)}\`, { scroll: false })` after submitting to Headless Commerce, so the address bar reflects what was actually searched. A new `committedQuery` state (distinct from the live `commerce.query`, which changes on every keystroke) tracks this and is passed to `Header`.
- `Header` gains an optional `currentQuery?: string` prop. A `withCurrentQuery(href, currentQuery)` helper appends `?q=<currentQuery>` onto the Products/Blog nav links when present, so navigating away from an active search carries the query forward. The uncontrolled-mode search input also seeds its default value from `currentQuery` instead of always starting blank.
- `/blog` and `/blog/[id]` (both Server Components) read `searchParams.q`, trim it, and use it: `/blog` passes it as the query to `searchTrendingContent` (falling back to the existing hardcoded `"robotics"` default when absent) and both pages pass the resolved value to `<Header currentQuery={...}>` so nav links stay consistent while reading an article reached via a searched context.
- `not-found.tsx` under `/blog/[id]` is deliberately left unpropagated — Next.js's special `not-found.tsx` file doesn't receive a `searchParams` prop, so there is no query to forward there. This is an accepted limitation, not an oversight.

## Consequences

- No new client-side state library or Context provider was introduced; the URL is the single carrier for this one string, which keeps it reload-safe and deep-link-safe by construction (`/blog?q=welding` works from a fresh tab, not just via in-app navigation).
- The propagated query is UI-nav convenience only — it does not couple the two Coveo search domains. `/catalog` still queries Commerce and `/blog` still queries content Search API independently; nothing here changes ADR-relevant isolation between RGA/content and product search.
- Each page still falls back to its own existing default when `?q=` is absent (`/blog` uses `"robotics"`, `/catalog`'s Headless Commerce engine still defaults to `"welding arm"` on first load), so a direct/bare visit to any page is unchanged from prior behavior.
- If a future page needs the same "last query" carried into it, the pattern is to read `searchParams.q` (Server Components) or accept a `currentQuery` prop (Client Components) rather than introducing global state — this ADR sets that precedent.
