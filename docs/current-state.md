# Current State

## Stack

- Framework: Next.js App Router on Next `^16.2.10`.
- Runtime/UI: React `^19.2.7`, React DOM `^19.2.7`, TypeScript `^6.0.3`.
- Coveo integration: `@coveo/headless` `^3.4.1`.
- Icons: `lucide-react` `^1.25.0`.
- E2E: Playwright with Chromium.
- Automated accessibility: `@axe-core/playwright`.
- Package manager: npm, with `package-lock.json` lockfile version 3.
- Build mode: `next dev --webpack` and `next build --webpack`; README notes Webpack is intentional because the current Turbopack build path has Coveo Headless package metadata issues.
- Next config: `reactStrictMode: true`.

## Existing Components

- Layout:
  - `src/components/layout/Header.tsx`
  - `src/components/layout/Footer.tsx`
- Shared:
  - `src/components/shared/ConfigurationNotice.tsx`
- Search shell:
  - `src/components/search/SearchExperience.tsx`
  - `src/components/search/SearchBox.tsx`
  - `src/components/search/SearchBoxView.tsx`
  - `src/components/search/SearchSuggestions.tsx`
  - `src/components/search/Pagination.tsx`
  - `src/components/search/SortControl.tsx`
  - `src/components/search/SearchSummary.tsx`
  - `src/components/search/PagerControls.tsx`
  - `src/components/search/search-ui.constants.ts`
- Headless result rendering:
  - `src/components/search/results/ResultListView.tsx`
  - `src/components/search/results/ResultItem.tsx`
  - `src/components/search/results/ResultCard.tsx`
  - `src/components/search/results/result-fields.ts`
- Domain result rendering:
  - `src/components/search/results/DomainResultCard.tsx`
  - `src/components/search/results/ResultList.tsx`
  - `src/components/search/results/SearchResults.tsx`
  - `src/components/search/results/SearchStatus.tsx`
  - `src/components/search/results/ZeroResults.tsx`
- Headless facets:
  - `src/components/search/facets/FacetPanel.tsx`
- Domain/sample facets:
  - `src/components/search/facets/DomainFacetPanel.tsx`
- Legacy sample response aliases:
  - `src/components/search/response/search-response-types.ts`
- Supporting rail:
  - `src/components/search/layout/SearchInsightsRail.tsx`

## Existing Architecture

The application is a client-rendered Coveo Headless search UI wrapped by a Next.js App Router page.

Current request flow:

```text
Browser search UI -> /api/search-token -> Coveo token endpoint
Browser search UI -> Coveo Search API directly with short-lived token
```

`src/app/api/search-token/route.ts` is the only backend route. It reads server-side Coveo environment variables, builds a token payload with identity, search hub, and optional pipeline, then requests a short-lived token from Coveo. It also returns non-secret client configuration such as organization id, search hub, pipeline, and configured facet fields. Responses are marked `no-store`.

`src/components/search/SearchExperience.tsx` owns most runtime orchestration. It fetches token config only after the user submits the startup form, builds the Coveo search engine, registers Headless controllers, executes the first search, and renders search box, result list, facets, pagination, summary, errors, and insight rail.

There is also a sample response path gated by feature flags. In that mode, `src/app/page.tsx` selects typed profile-specific fixtures from `src/features/demo-profiles/profile-fixtures.ts` and passes the complete domain `SearchResponse` to `SearchExperience`. The client wraps that response in `InMemorySearchProvider`, so query submission, suggestions, facets, sorting, and numbered pagination still go through the `SearchProvider` contract.

The main architectural weakness is that `SearchExperience` is still a large composition root. Phase 6 extracted sample provider orchestration into `useSampleExperienceProviders`, but live UI components remain coupled directly to Coveo Headless controller types. That is intentional because replacing live Headless controllers without a real Coveo organization would risk credentials, analytics, facets, suggestions, and pagination behavior outside the quality scope.

```text
UI Components
  -> Feature / Domain Hooks
  -> Search Controller or Search Store
  -> Search Provider Interface
  -> Mock Search Provider / Coveo Search Provider
```

## Existing Feature Flags

Feature flags are defined in `src/lib/features/search-feature-flags.ts`:

- `enableFacets`
- `enableInsightsRail`
- `enablePopularContent`
- `enableRelatedQueries`
- `enableSampleSearchResponse`
- `enableTopicInsight`

Server-side environment parsing lives in `src/lib/features/search-feature-flags.server.ts`. The flags are read in `src/app/page.tsx` and passed into `SearchExperience`.

The default exported client flag values set sample response mode to `false`, but the server parser defaults `COVEO_FEATURE_SAMPLE_SEARCH_RESPONSE` to `true`. That is intentional for local/demo composition, but it is easy for a reviewer to miss because the defaults differ by entry point.

## Existing Provider Boundary

Search domain models live in `src/features/search/models/search-models.ts`.

Provider abstractions live in `src/features/search/providers/`:

- `search-provider.ts`: shared `SearchProvider` interface.
- `in-memory-search-provider.ts`: domain-backed provider used by sample mode for query text, suggestions, filters, sorting, and pagination.
- `mock-search-provider.ts`: maps the existing sample Coveo-shaped fixture into the search domain model.
- `coveo-response-mapper.ts`: raw provider-to-domain mapping boundary with defensive defaults for missing or malformed data.
- `coveo-search-provider.ts`: skeleton for a future server-safe Coveo provider implementation.

The provider abstraction decision is documented in `docs/decisions/0001-search-provider-abstraction.md`.

## Current Search Experience

Sample-mode behavior:

- Uses a discriminated `SearchState` union with `initial`, `loading`, `success`, `empty`, and `error`.
- Uses controlled search input, submit, clear, debounced provider suggestions, Escape close, Arrow Up/Down navigation, Enter selection, and mouse selection.
- Renders domain result cards through a centralized result variant resolver for `article`, `documentation`, `video`, `community`, `product`, and default fallback.
- Supports configured facets for Content Type, Source, and Product when present in the provider response. Date is intentionally not surfaced because the current provider model does not support date-range semantics cleanly.
- Supports active filter summary, clear one facet group, clear all filters, and selected-value preservation.
- Supports Relevance, Newest, and Most Popular sort. Most Popular is deterministic in sample mode using fixture order-derived metadata because the fixture has no real popularity metric.
- Uses numbered pagination with previous/next controls, current page indication, and page reset on query, facet, and sort changes.
- Provides a dedicated zero-results state with query text, clear-filter action when filters are active, suggested searches, and retry broader search.

Live Coveo behavior:

- Keeps the secured Headless path: `/api/search-token` mints a short-lived token, then browser-side Headless controllers query Coveo directly.
- Search box accessibility and keyboard handling were improved without replacing `buildSearchBox`.
- Headless facets remain controller-driven. Clear all now deselects all registered facet controllers.
- Live sorting remains Coveo relevance only. The UI does not expose Newest or Most Popular for live mode because no configured Headless sort controller or Coveo sort criteria are present yet.

Phase 6 additions:

- Playwright E2E coverage for sample search, suggestions, facets, sorting, pagination, zero-results recovery, generative states, profiles, browser navigation, live safety, keyboard behavior, and responsive viewports.
- Axe accessibility checks for serious and critical violations.
- Profile-specific fixtures for developer documentation, customer support, ecommerce, and minimal.
- Request cancellation and stale-response guards for suggestions, sample search, and token configuration fetches.
- Stable skeleton dimensions for results, generative answers, and trending content.
- Safer external URL handling and redacted token route errors.

## Existing Agents

Repo-local agent prompts live in `.codex/agents/`:

- `commit-agent.md`: pre-commit reviewer for tree hygiene, architecture fit, validation, and commit readiness.
- `test-agent.md`: focused test author for changed application logic.
- `context-agent.md`: documentation updater when architecture, setup, workflow, security, or reviewer-facing behavior changes.

`.codex/README.md` documents the intended default flow and non-negotiables. `AGENTS.md` also references the same agent lanes and requires `commit-agent` before committing.

## Existing Workflows

Local scripts:

- `npm run dev`
- `npm run lint`
- `npm run test`
- `npm run test:coverage`
- `npm run test:e2e`
- `npm run test:e2e:ui`
- `npm run typecheck`
- `npm run build`
- `npm run hooks:install`
- `npm run workflow:check`
- `npm run workflow:precommit`
- `npm run workflow:push`

Git hooks:

- `.githooks/pre-commit` runs `npm run workflow:precommit`.
- `.githooks/pre-push` runs `npm run workflow:push`.
- `scripts/install-hooks.mjs` installs committed hooks through `core.hooksPath`.
- `scripts/pre-commit-check.mjs` checks staged or full-tree diffs, blocks likely secrets and generated/local paths, runs whitespace checks, lint, and, when code/config changed, coverage, typecheck, and build.

CI:

- `.github/workflows/ci.yml` runs on pull requests and pushes to `main`.
- CI uses Node 24, `npm ci`, then `npm run workflow:check`.

Pull request template:

- `.github/pull_request_template.md` requires summary, architecture/security checklist, validation evidence, configuration impact, screenshots/evidence, merge checklist, and known limitations.

## Testing

Test framework:

- Vitest `^4.1.10`
- jsdom environment
- React Testing Library
- `@vitest/coverage-v8`
- Playwright for browser E2E
- `@axe-core/playwright` for automated accessibility checks

Coverage configuration in `vitest.config.ts` includes:

- `src/app/api/search-token/route.ts`
- `src/lib/coveo/search-token.ts`
- `src/components/search/SearchExperience.tsx`
- New Phase 3 search components under `src/components/search`
- `src/components/search/results/result-fields.ts`
- `src/components/shared/ConfigurationNotice.tsx`
- New Phase 3 search state, provider, facet, sorting, pagination, and result-template helpers under `src/features/search`

Coverage thresholds are enforced per file at 80% for statements, branches, functions, and lines.

Existing tests cover:

- Search token route success and failure behavior.
- Client search-token config fetch behavior.
- Server feature flag parsing.
- Search experience startup, configuration failure, query handoff, token renewal, and sample response mode.
- Sample-mode provider search flow, query suggestions, facet updates, sort changes, pagination, zero-results recovery, and result variants.
- Search state transitions, query helper behavior, pagination calculations, sort mapping, result-template fallback behavior, facet label/order configuration, and in-memory provider behavior.
- Result field extraction.
- Configuration notice rendering.
- Profile-specific fixture selection.
- Unsafe result URL handling.
- Sample provider orchestration.
- E2E flows for search, suggestions, facets, sorting, pagination, zero results, generative answers/errors, profile behavior, browser history, responsive layout, keyboard interaction, and credential-free live safety.

Documentation for Phase 6 testing lives in `docs/testing-strategy.md`, `docs/accessibility.md`, `docs/security-review.md`, and `docs/performance-review.md`.

## Risks

- The provider boundary is still split by runtime. Sample mode now uses a domain model, reducer, and provider-driven UI; live mode still depends directly on Coveo Headless controllers. That is acceptable for Phase 3, but it remains the next real architecture boundary to resolve.
- `SearchExperience.tsx` is still carrying live Headless responsibilities: token loading, engine creation, controller construction, startup state, ready state, layout, and error rendering.
- Search state is explicit in sample mode but remains implicit in multiple Headless controller states in live mode.
- Live sorting is intentionally limited to relevance until Coveo sort criteria or a Headless sort controller are configured.
- Analytics exists through Coveo Headless configuration and result click tracking with `buildInteractiveResult`, but submit, suggestion selection, facet, sort, and pagination analytics are not surfaced as explicit app-level events.
- Sample response mode is useful for demos and now exercises the provider/domain contract with profile-specific fixtures, but it still uses domain components separate from live Headless controller components.
- There is a stray `src/components/search/.DS_Store` local artifact in the working tree view. It should not be committed or used as part of the app.
- The application is now partly organized under `src/features/search`, but analytics and future demo-profile work remain deferred.

## Recommended Changes

1. Decide how the live Headless path should meet the provider/domain boundary without regressing controller-owned facets, suggestions, pagination, and analytics.
2. Extract Headless engine/controller setup out of `SearchExperience.tsx` only after it can be verified against a real Coveo organization.
3. Integrate live Coveo generative answers only after supported endpoints and server-side credentials are confirmed.
4. Add live Coveo sort only after the target sort criteria are configured and can be represented honestly in Headless.
5. Add URL synchronization only after the provider/state boundary is stable.
6. Replace the live analytics skeleton with a supported Coveo analytics adapter only after the target event contract is confirmed.
7. Keep tests focused around provider mapping, state transitions, and pure result/facet logic before attempting broad browser-level Headless tests.
8. Keep the backend route limited to token minting unless assessment requirements explicitly change. A full search proxy would add operational surface without solving a current problem.
9. Remove local artifacts such as `.DS_Store` from the working tree and ensure the hook gate continues blocking generated or local files.

## Phase 4 Current State

Phase 4 added provider-independent generative, trending, feedback, and analytics layers without merging the live and sample search paths.

New components:

- `src/components/generative/GenerativeAnswer.tsx`
- `src/components/generative/GenerativeAnswerSkeleton.tsx`
- `src/components/generative/GenerativeAnswerContent.tsx`
- `src/components/generative/GenerativeCitations.tsx`
- `src/components/generative/GenerativeCitation.tsx`
- `src/components/generative/GenerativeFeedback.tsx`
- `src/components/generative/GenerativeError.tsx`
- `src/components/generative/GenerativeNoAnswer.tsx`
- `src/components/content/TrendingContent.tsx`

New provider boundaries:

- `GenerativeProvider`: normalized generated-answer contract.
- `MockGenerativeProvider`: deterministic fixture-backed answer, no-answer, error, and delayed-answer scenarios.
- `CoveoGenerativeProvider`: live skeleton that throws a typed configuration error until a supported server-side integration exists.
- `FeedbackProvider`: local/in-memory feedback submission boundary.
- `TrendingProvider`: normalized trending content contract.
- `AnalyticsProvider`: typed app analytics contract with local console and live skeleton adapters.

New feature flags:

- `enableAnalytics`
- `enableGenerativeAnswers`
- `enableGenerativeCitations`
- `enableGenerativeDisclaimer`
- `enableGenerativeFeedback`
- `enableGenerativeStreaming`
- `enableTrendingContent`

Sample-mode behavior:

- Generated answers are fixture-backed and query-driven.
- Queries containing `no answer` trigger the no-answer state.
- Queries containing `error` trigger the error state.
- Citations are validated before rendering as external links.
- Feedback supports helpful, not helpful, and negative reasons without backend persistence.
- Trending content is deterministic fixture data with rank, type, view count, trend percentage, reason, and time window.
- App analytics emit typed events through `ConsoleAnalyticsProvider` when enabled.

Live Coveo behavior:

- The secured Headless search path remains unchanged.
- Coveo Headless analytics remain enabled in engine configuration.
- Live result clicks still call `buildInteractiveResult().select()`.
- Live generated answers are not claimed as integrated. The live provider is a skeleton and should remain disabled unless deliberately testing the controlled not-configured state.
- The live app analytics adapter is a skeleton; no custom live analytics transport is claimed in Phase 4.

Phase 4 tests cover:

- Generative state transitions.
- Mock and skeleton generative providers.
- Citation URL validation and citation click analytics.
- Feedback submission, negative reasons, duplicate prevention, and error handling.
- Trending provider, loading, success, empty, error, sparse item, invalid URL, and click analytics behavior.
- Analytics provider timestamping, disabled behavior, and safe payload construction.
- Feature-flag resolution for enabled and disabled states.
- Search-experience instrumentation for search, suggestions, facets, filters, sorting, pagination, result clicks, zero results, generative answers, and disabled analytics.

## Phase 5 Current State

Phase 5 adds platform capability infrastructure without unifying the sample and live provider paths.

New platform modules:

- `src/features/feature-flags/feature-flags.ts`: authoritative hierarchical `FeatureFlags` type, defaults, deterministic resolver, and known-key deep merge.
- `src/features/feature-flags/env-feature-flags.ts`: strict boolean parsing and environment override mapping.
- `src/features/demo-profiles/demo-profiles.ts`: typed profiles for `developer-documentation`, `customer-support`, `ecommerce`, and `minimal`.
- `src/features/development/scenarios.ts`: typed development/test-only scenario selection.
- `src/features/search/services/search-url-state.ts`: pure parse/serialize/normalize helpers for sample-mode URL state.
- `src/features/search/capabilities/provider-capabilities.ts`: explicit search and generative provider capabilities.
- `src/lib/runtime/runtime-config.ts`: central public and server-only runtime configuration parsing.
- `src/lib/errors/application-error.ts`: shared typed error model and sanitizing mapper.
- `src/lib/logging/logger.ts`: lightweight structured logging with redaction.

Feature flag resolution order:

```text
base defaults -> environment overrides -> demo profile overrides -> development query overrides
```

Sample-mode URL state supports `q`, `page`, `sort`, `contentType`, `source`, and `product`. `profile` and `scenario` are development-only query parameters. Invalid page and sort values normalize safely; unknown facets are ignored.

Live Coveo behavior remains conservative:

- The Headless token path is unchanged.
- Live sorting remains relevance-only.
- Live generative UI is hidden because the skeleton declares no confirmed live capability.
- Headless usage analytics remain separate from app-level analytics.

Known Phase 5 limitations:

- Demo profiles no longer share one mapped fixture; Phase 6 added typed profile-specific fixture sets.
- URL synchronization is sample-mode only.
- Development scenarios are deterministic but lightweight; `partial` is reserved for future fixture shaping.
- Structured logging defaults to conservative console output to avoid noisy render-time logs.

## Phase 6 Current State

Phase 6 added quality, reliability, accessibility, security, and performance readiness without adding agent automation, Git hook changes, PR automation, CI workflow changes, Storybook, live Coveo generative integration, or backend feedback persistence.

New quality files:

- `playwright.config.ts`
- `tests/e2e/search-flows.spec.ts`
- `tests/e2e/profiles-navigation.spec.ts`
- `tests/e2e/accessibility.spec.ts`
- `tests/e2e/keyboard-responsive.spec.ts`
- `docs/testing-strategy.md`
- `docs/accessibility.md`
- `docs/security-review.md`
- `docs/performance-review.md`

New application boundaries:

- `src/components/search/use-sample-experience-providers.ts`: focused sample provider orchestration.
- `src/features/demo-profiles/profile-fixtures.ts`: deterministic profile-specific fixtures.

Phase 6 behavior:

- Playwright covers the required sample-mode E2E flows without real Coveo credentials.
- Axe checks serious and critical accessibility issues.
- Responsive assertions cover `375x812`, `768x1024`, `1024x768`, and `1440x900`.
- Suggestions, sample search, and token config fetching use abortable requests.
- Sample search uses request sequencing so stale responses do not replace newer state.
- Search results, generative answers, and trending content use more stable skeleton dimensions and accessible loading announcements.
- Result, citation, and trending URLs are validated before navigation.
- The search-token route redacts upstream Coveo failure details.
- Production rejects development query overrides.

Remaining limitations:

- Live Headless components are still controller-driven and not fully hidden behind the provider abstraction.
- Live Coveo browser tests remain credential-free safety checks only.
- Real production Web Vitals require deployment telemetry.
- The existing Coveo Headless Webpack critical-dependency warning remains unchanged.
