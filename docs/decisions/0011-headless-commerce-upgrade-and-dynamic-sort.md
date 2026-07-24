# ADR 0011: `@coveo/headless` upgrade (manual numeric facet fix) and dynamic sort options

## Status

Accepted

## Context

The price facet (`ec_price`) uses a continuous slider backed by `NumericFacet.setRanges()` rather than one of Coveo's server-generated buckets, since the user picks an arbitrary min/max rather than toggling a fixed range (see `ProductFacetPanel.tsx`'s `PriceRangeFacetControl` and `toggleRangeValue` in `use-headless-commerce.ts`).

On `@coveo/headless@3.4.1`, setting a manual range did not actually filter results: `setRanges()` idled the previous auto-generated bucket facet request for `ec_price` but did not remove it, so the outgoing Commerce API request carried two conflicting facet entries under the same `facetId` (the stale, idled bucket definition, and the new manual range). The Commerce API resolved the conflict in favor of the bucket definition, so the manual range was silently dropped for actual result filtering — even though the UI slider/chip displayed the selected range correctly, because that display is sourced from local Redux state (`manualNumericFacetSet`) that the server response never touches.

This was a defect in Coveo's own library, not in this app's facet wiring. It was already fixed upstream: `@coveo/headless`'s changelog lists *"fix(headless): capi 1587 facets are duplicated in capi request payload when using manual numeric facet"*. Verified directly in the bundled source before and after upgrading: the request builder's `getFacets2` now substitutes the manual-range facet in place of the stale bucket entry for a given `facetId`, instead of appending both.

## Decision

- Upgraded `@coveo/headless` from `^3.4.1` to `^3.53.1` (latest 3.x — avoids the unrelated 4.0/5.0 major-version surface).
- Adjusted two breaking changes the version jump introduced, both unrelated to the facet fix itself:
  - `getOrganizationEndpoints` / the `organizationEndpoints` engine config option no longer exist — endpoint resolution from `organizationId` is now automatic. Removed from `use-headless-commerce.ts` and `use-global-search-suggestions.ts`.
  - `originContext` was dropped from the commerce engine's `analytics` config type (`Pick<AnalyticsConfiguration, 'enabled' | 'proxyBaseUrl' | 'source' | 'trackingId'>` no longer includes it). Removed from both call sites.
  - `FacetGenerator` can now produce a `"location"` facet controller type; added `"location"` to the structural `HeadlessFacetLike.state.type` union in `headless-commerce-mappers.ts` so `mapHeadlessFacets` stays assignable (it already falls through to `undefined` for unhandled types, so no new branch was needed).
- While in this area, replaced the hardcoded sort UI with a data-driven one: `appliedSort`/`availableSorts` were previously hardcoded to `"relevance"` in `buildSearchResponse` regardless of what `bundle.sort.state.availableSorts` actually returned, and the toolbar rendered a static `<span>Relevance</span>` with no way to change it. Added `mapHeadlessSort`/`getSortCriterionId` in `headless-commerce-mappers.ts` (structurally typed, no `@coveo/headless` import, consistent with this file's existing pattern) to turn whatever `SortCriterion[]` the commerce interface config returns into `{ id, label }` options, an `updateSort(id)` action in `use-headless-commerce.ts` that resolves an id back to the matching `SortCriterion` and calls `sort.sortBy()`, and a `<select>` in `ProductDiscoveryExperience.tsx` that only renders when more than one option is available (falls back to the previous read-only label when it's relevance-only, which is the only case exercised so far since this Coveo org's commerce interface currently defines no other sort criteria).

## Consequences

- The price (and any other) manual numeric range facet now actually filters results; previously it only affected the displayed chip/slider position.
- The product list sort will automatically show additional options (e.g. price low-to-high) the moment they're configured as sort criteria on the commerce interface in the Coveo admin console — no further code change needed on this side. Today it still renders relevance-only, because that's the only criterion the org's commerce interface config currently returns.
- Added `commerce_sort_changed` to `AnalyticsEventName` in `analytics.tsx`, following the existing `commerce_facet_selected` / `commerce_page_changed` naming.
- No other `@coveo/headless` consumers in the codebase referenced the removed APIs; `npm run typecheck`, `npm run lint`, and `npm run build` all pass post-upgrade.
