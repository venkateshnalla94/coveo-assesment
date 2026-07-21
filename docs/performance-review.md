# Performance Review

## Measured

Phase 6 uses the standard validation commands as the primary measurement baseline:

- `npm run build` for route size and bundling warnings.
- Playwright responsive checks for layout overflow and usability.
- Unit/E2E tests for duplicate request, cancellation, and stale-response behavior.

A permanent bundle analyzer was not added. That would be tooling weight without enough evidence for this assessment.

Latest build result:

- `npm run build` completed successfully.
- App routes remain `/`, `/_not-found`, and `/api/search-token`.
- The existing Coveo Headless Webpack critical-dependency warning remains present and unchanged.

## Changes

- Sample-mode providers are memoized in `useSampleExperienceProviders`, reducing provider recreation and keeping disabled optional providers uninitialized where possible.
- Suggestions, sample search, and token configuration requests support cancellation with `AbortController`.
- Sample search uses request sequencing so older responses cannot replace newer state.
- Generative and trending blocks render independently from search results.
- Result, generative, and trending skeletons have stable dimensions to reduce layout shift.
- Loading announcements use status semantics instead of competing spinners.
- Profile-specific fixtures avoid large fixture volume while still demonstrating different behavior by profile.

## Web Vitals Readiness

Likely LCP contributors:

- Header and search shell content.
- First result-card render.
- Coveo Headless client bundle in live mode.

Likely CLS contributors:

- Result list replacement after search.
- Generative answer expansion.
- Trending rail loading.

Likely INP contributors:

- Search submission.
- Suggestion navigation and debounce.
- Facet and pagination updates.

Mitigations added in Phase 6:

- Stable skeleton sizing for asynchronous blocks.
- Cancellation for stale requests.
- No visual-regression platform or heavy analyzer added.
- Optional sample generative/trending providers are not initialized for the minimal profile.

## Remaining Concerns

- Live mode still carries the Coveo Headless dependency in the client bundle.
- The existing Coveo Headless Webpack critical-dependency warning remains unchanged.
- Real production Web Vitals require deployment telemetry; this phase only adds readiness and deterministic local checks.
