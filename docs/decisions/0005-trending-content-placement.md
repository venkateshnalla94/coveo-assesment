# ADR 0005: Trending Content Placement and Product Linking

## Status

Accepted (supersedes two interim placements — see History)

## Context

`TrendingContent` (backed by `CoveoContentTrendingProvider`, a Coveo Search API content query) was originally rendered twice: once in the catalog page's `ProductRightRail` as "Technical Resources," alongside AI Guidance and the Generated Answer, and once in `SearchInsightsRail` (currently unused). On the catalog page it duplicated the same generic ranked-list treatment next to two other AI-driven surfaces, competing for attention without a distinct purpose.

Separately, `TrendingItem` (and the Coveo content index results it's mapped from — see `mapContentSearchResults` in `src/app/api/coveo/content/search/route.ts`) carries no product SKU or `permanentid` reference. Content results only yield `title`, `url`, `excerpt`, `source`, and `filetype`. There is no reliable, structural way to resolve "this article mentions product X" to an actual catalog entry without fragile text-matching against unstructured excerpt text — which risks producing wrong links. Per-article "detected product" deep-links are explicitly out of scope for this reason; it would need either content tagged with related SKU metadata in the Coveo index, or text-mining excerpts against a live brand list, both bigger changes than this ADR covers.

### History: rejected home-page placements

Two earlier attempts at giving Trending Content a purpose were tried and reverted:

1. Replacing the home page's static, searchable `popularSearches` pills with live trending item titles used as search queries. Rejected: trending items are blog/case-study content (`TrendingItem.url` points to articles), not search terms, so routing them through `/catalog?q=<article title>` produced nonsensical searches and removed a working, intentional affordance (the pills).
2. Keeping the pills, and adding a separate "Trending Topics" section on the home page seeded by a fixed query (`SEARCH_UI.defaultQuery`, i.e. `"welding arm"`), with a "Shop '{query}' products" CTA. This looked like real trending content but wasn't: the seed was a hardcoded constant, not a live signal, so the section (and its CTA label) said "welding arm" regardless of what the user typed or did. Making it reactive to every keystroke was also rejected — re-fetching content on each keystroke is wasteful and the UI shouldn't constantly reshuffle while someone is mid-type.
3. Moving `TrendingContent` into the catalog page's results column, below `Pagination`, once Generated Answer still occupied the right rail. Superseded once Generated Answer itself moved (see below) — the right rail was the more natural home once it was free.

The underlying problem behind attempts 1–2: the home page has no *real, submitted* query to key genuine content off of before the user searches — only whatever is transiently in the box.

## Decision

- `TrendingContent` is removed from the home page entirely. Home stays just the search box + static `popularSearches` pills.
- `TrendingContent` lives in the catalog page's **right rail** (`ProductRightRail.tsx`), in the slot Generated Answer used to occupy, right after the "AI Product Guidance" card — Generated Answer moved out to a horizontal banner above the results (see ADR 0006), which freed that slot.
- It's seeded from the query passed into `ProductRightRail` (`commerce.query`, falling back to `"welding arm"` only when empty) via `useMemo(() => new CoveoContentTrendingProvider(query), [query])`, owned by `ProductRightRail` itself. This only re-fetches when the submitted query changes (i.e., on navigation/search submission), never on keystrokes, because `commerce.query` only changes on submit.
- No "shop related products" CTA on the catalog page — the user is already looking at catalog results for that query, so the CTA would be redundant. Article links remain external only (`target="_blank"`, `trending_content_clicked` analytics event).

## Consequences

- Trending content is now genuinely tied to a real, deliberate signal (an actual submitted search) instead of either a hardcoded constant or a live-typing race.
- The catalog page's right rail holds AI Product Guidance + Related Technical Resources — supplementary/research material, not competing with the Generated Answer banner which now leads the results column.
- The home page is back to its original, working search entry point with no misleading "trending" dressing.
- If genuine query-independent "what's trending site-wide" content is wanted later (e.g., via a real Coveo recommendation/ML model rather than a query-scoped content search), that's a different capability and a separate decision — this ADR only covers query-scoped content search.
