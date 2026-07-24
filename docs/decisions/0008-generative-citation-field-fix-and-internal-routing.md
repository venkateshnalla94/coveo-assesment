# ADR 0008: Generative Citation Field Fix and Internal Article Routing

## Status

Accepted

## Context

The RGA event stream parsed in `src/app/api/coveo/generative/answer/route.ts` requests extra fields per citation via `citationsFieldToInclude` (`source`, `filetype`). The real `@coveo/headless` payload nests those requested fields under a `fields` object on each citation entry rather than flattening them onto the citation directly. The original parsing code read `item.source` / `item.filetype` at the top level, which is never populated — `citation.source` and `citation.filetype` were silently `undefined` in production, and the UI's `<small>{citation.source}</small>` line simply never rendered rather than throwing, so the bug went unnoticed.

Separately, every citation's title rendered as the only clickable element, opening straight to the external source (`target="_blank"`) — the same "identity hash as route id" scheme ADR 0007 established for Trending Content (`raw.permanentid` → `/blog/{id}`) already exists for content Coveo has indexed, but generative citations were not taking advantage of it even when the citation resolved to one of our own indexed articles. That meant a citation Coveo could resolve internally still sent the user off-site, and the excerpt beneath each citation could run to a full ML-highlighted passage rather than a scannable preview.

## Decision

- Read `item.fields.source` / `item.fields.filetype` instead of `item.source` / `item.filetype` in `parseEventStream` — this is the actual fix for the field-parsing bug, not a behavior change.
- Capture the citation's top-level `permanentid` field as `citation.permanentId`, reusing the exact identifier scheme `TrendingItem.id` and `/blog/[id]` already key off of (ADR 0007). No new identifier scheme is introduced.
- `GenerativeCitation` (the model) gains optional `filetype` and `permanentId` fields — both optional, so existing mock fixtures and callers are unaffected.
- `GenerativeCitation` (the component) changes its link target: the citation title itself is now plain text (`.citation-title`, not a link), and a single "Read more" CTA does the routing — internally via `next/link` to `/blog/{permanentId}` when the citation has one, otherwise externally to the safe-checked source URL exactly as before. The `generative_citation_clicked` analytics event gains a `destination: "internal" | "external"` field so this split is observable, not just a UI-level assumption.
- Citation excerpts are truncated to a ~4-sentence/320-char preview via `getExcerptPreview`, mirroring the existing `truncateReason` pattern in `src/lib/coveo/content-search.ts` rather than inventing a new truncation strategy.
- Unrelated to citations but touching the same `/blog/[id]` surface in this change: `src/lib/coveo/content-search.ts`'s tag-list parser was generalized from `tagsFrom` to `semicolonListFrom` and reused to parse `raw.images` (a semicolon-delimited list of extra product images) into `TrendingItem.images`, deduping the hero image out of the list. `/blog/[id]` renders these as an image strip between the article body and the tags section. This is additive metadata mapping, not a new security boundary — no new external call, no new client-exposed secret, and the images are rendered as plain `<img>` elements, not through `dangerouslySetInnerHTML`.

## Consequences

- The `source`/`filetype` fix means citation subtitles (`Source Name · PDF`) now actually render in production where they previously silently didn't — this is a visible behavior change users will notice for the first time, even though it corrects an existing intended feature rather than adding a new one.
- Citations that resolve to Coveo-indexed articles now keep users in-app (routing to `/blog/{permanentId}`) instead of sending them to the external source; citations without a `permanentId` are unaffected and keep the prior external-link behavior via the same `getSafeCitationUrl` allowlist.
- No change to the security boundary described in ADR 0007 / `docs/security-review.md`: `COVEO_PLATFORM_API_KEY` still never reaches client code, and the RGA route remains a narrow content/RGA-support server path, not a general search proxy.
