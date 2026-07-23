# ADR 0007: Trending Content Full-Payload Cards and Internal Article Detail Page

## Status

Accepted

## Context

`mapContentSearchResults` (the mapper behind `/api/coveo/content/search`, since moved into `src/lib/coveo/content-search.ts`) only ever kept `title`, `url`, `type`, a truncated `reason`, and `timeWindow` from each Coveo content result, discarding fields Coveo already returns on every result: `raw.author`, `raw.date`, `raw.category`, `raw.tags`, `raw.featured_image_url`, `raw.word_count`, and the full article body (`raw.content` HTML / `raw.body` markdown). `TrendingContent` cards were consequently thin — title plus a one-line excerpt — and every card's title linked straight out to the external source (`target="_blank"`), skipping past all of that richer in-index content entirely.

ADR 0005 established that Trending Content has no product SKU/`permanentid` reference for resolving an article to a catalog entry, and ruled per-article "detected product" deep-linking out of scope for that reason. That finding is unaffected here: `raw.permanentid` is the content item's own stable identity hash (Coveo's article/document id), not a product reference — using it as this article's own route id is a different thing than the SKU-linking ADR 0005 discussed.

## Decision

- `TrendingItem` gains optional `author`, `publishedAt`, `category`, `tags`, `imageUrl`, `wordCount`, and `body` fields. All optional, so `MockTrendingProvider` fixtures and existing tests keep working unchanged.
- Item `id` now prefers `raw.permanentid` over `uniqueId`/`rawUriHash` — `uniqueId` embeds `$` and `://` and is awkward as a URL path segment; `permanentid` is a clean alphanumeric hash purpose-built as a stable identifier.
- Coveo-calling logic is consolidated into `src/lib/coveo/content-search.ts`: `searchTrendingContent(query, numberOfResults)` for the list (never includes `body`, keeping the right-rail card payload small) and `fetchTrendingArticle(id)` for a single item, looked up via `aq: '@permanentid=="<id>"'`, which does include the sanitized body. Both `/api/coveo/content/search/route.ts` and the new `/blog/[id]` Server Component import this module directly, rather than the page issuing its own HTTP call back to the route — avoiding a Server Component fetching its own API route.
- The article body is untrusted third-party HTML from the external blog source. `fetchTrendingArticle` sanitizes it server-side with `sanitize-html` (new dependency) — an allowlist of basic content tags, and a forced `target="_blank" rel="noopener noreferrer"` transform on any `<a>` — before it is ever sent to a client. This is the security boundary that makes it safe to render with `dangerouslySetInnerHTML` on the article page.
- New route: `/blog/[id]`, an async Server Component. Not found (`fetchTrendingArticle` returns nothing) renders a dedicated `not-found.tsx` rather than a generic 404.
- Trending list cards link internally to `/blog/{id}` (`next/link`) instead of opening the external source directly. The external "View original source" link moves to the article page itself, reusing the existing `getSafeTrendingUrl` protocol allowlist (http/https only, `"#"` fallback) — the same safe-link pattern, just relocated.
- Cards show up to 3 tags with a bounded `max-width` + ellipsis so pill sizes stay visually consistent regardless of tag text length, rather than every pill sizing purely to its own text.

## Consequences

- `src/app/api/coveo/content/search/route.ts` is no longer the only Coveo-content-calling code path — `src/app/blog/[id]/page.tsx` also calls Coveo Search API directly, via the same shared lib and the same server-only `COVEO_PLATFORM_API_KEY`. CLAUDE.md/AGENTS.md's architecture notes were updated to describe these as narrow, content/RGA-support server paths rather than implying a single backend route.
- `sanitize-html` is a new production dependency. It only runs in Node route handlers/Server Components — no client bundle impact.
- Because `permanentid` is the article's own identity, not a product reference, this ADR does not reopen ADR 0005's decision that per-article "detected product" deep-linking remains out of scope.
- If a future need arises for content authored outside these known Coveo fields (e.g. a source with no `raw.content`/`raw.body` at all), `fetchTrendingArticle` already falls back to rendering `reason` as plain text on the article page — there is no hard failure, just a thinner page.
