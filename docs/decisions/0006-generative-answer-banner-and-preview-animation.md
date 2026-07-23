# ADR 0006: Generated Answer Placement and Preview Animation

## Status

Accepted

## Context

Generated Answer went through two prior iterations in this session:

1. Originally, `GenerativeAnswer.tsx` revealed the *entire* answer character-by-character over a live "streaming" state (`STREAMING_CHARACTER_INTERVAL_MS`), driven by a `GenerativeState` union with a `"streaming"` status and a `"streamed"` reducer action carrying `partialAnswer`. For long answers this took many seconds, and once finished, `GenerativeAnswerContent` immediately hard-truncated the fully-typed text to ~260 characters — users watched a slow typewriter just to see most of it disappear.
2. That was replaced with an instant sentence-aware preview (`getCompactAnswer`, first ~2 sentences) and no animation at all, to fix the slowness. This traded away the typing effect entirely.

Neither was right: the first was slow because it animated text nobody was going to keep reading in full; the second lost a piece of visual polish that was wanted back. Separately, Generated Answer lived in the ~300px-wide right rail (`ProductRightRail.tsx`), below "AI Product Guidance" — a narrow vertical card, not the prominent, horizontal placement it warranted as the primary AI surface on the page.

## Decision

**Placement:** `GenerativeAnswer` moves out of `ProductRightRail` and renders at the top of the results column in `ProductDiscoveryExperience.tsx`, above `.results-toolbar` (the "Showing X-Y of Z products for..." line). It keeps its existing `.generative-panel`/`.generative-header`/`.generative-content` styling unchanged — the results column is roughly 3x wider than the old right-rail slot, so the same markup now reads as a horizontal banner instead of a small sidebar box; no new CSS was needed. `ProductRightRail` keeps "AI Product Guidance" and gains `TrendingContent` in the vacated slot (see ADR 0005).

**Preview animation, capped:** Instead of animating the full answer (iteration 1) or nothing (iteration 2), `GenerativeAnswerContent` now animates *only* the already-computed 2-sentence preview string (`getCompactAnswer(answer)`), character-by-character, entirely as a local presentation effect — not tied to network streaming:
- The full answer is fetched once, in full, exactly as it is now (no SSE-driven partial reveal).
- `GenerativeAnswerContent` reveals the preview text a few characters per tick (`PREVIEW_REVEAL_CHARS_PER_TICK`/`PREVIEW_REVEAL_INTERVAL_MS`) via local `useState`/`useEffect`, reusing the existing `generative-streaming-text` cursor-blink CSS unchanged.
- The "Read full guidance and citations" button (and its modal, with the untruncated answer + citations) appears once the preview finishes revealing — same behavior as before, just gated on the local animation instead of a network-streaming state.
- `prefers-reduced-motion` shows the preview instantly, no animation.
- Because the animated string is capped at the preview length (~260-280 chars) regardless of how long the full answer is, total animation time stays bounded (~2 seconds) — this is what avoids reintroducing the original slowness while still restoring the typing effect.
- The existing `enableGenerativeStreaming` feature flag is reinterpreted as "animate the preview" (passed through as `animatePreview`) rather than removed, since it's already part of `SearchFeatureFlags` and wired through `ProductRightRail`/`GenerativeAnswer` call sites.

**Removed as fully dead:** the `"streaming"` `GenerativeState` status, the `"streamed"` reducer action (`generative-state.ts`), and the `isStreaming` prop/JSX branch in `GenerativeAnswer.tsx`/`GenerativeAnswerContent.tsx`. These existed only for the rejected iteration-1 SSE-driven reveal and were already unreachable once that reveal was removed — this ADR is the actual cleanup.

## Consequences

- Generated Answer is now the prominent, horizontal, above-the-fold AI surface on the catalog page; Trending Content and AI Guidance are secondary, right-rail material.
- The typing effect is back, but bounded — it can't regress to "takes many seconds for a long answer" because it never animates more than the preview.
- The generative state machine is smaller (`idle | loading | complete | no-answer | error`), with no unreachable states to reason about or accidentally re-wire.
- If a genuine incremental/live-token stream from Coveo's GenQA SSE endpoint is wanted later, it needs to be reintroduced deliberately (updating the preview reveal in place as tokens arrive) rather than assumed to still exist — the current `/api/coveo/generative/answer` route already fully consumes the SSE stream server-side before returning a single assembled answer, unchanged by this ADR.
