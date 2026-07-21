# Current State

## Stack

- Framework: Next.js App Router on Next `^16.2.10`.
- Runtime/UI: React `^19.2.7`, React DOM `^19.2.7`, TypeScript `^6.0.3`.
- Coveo integration: `@coveo/headless` `^3.4.1`.
- Icons: `lucide-react` `^1.25.0`.
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
  - `src/components/search/SearchBoxView.tsx`
  - `src/components/search/SearchSummary.tsx`
  - `src/components/search/PagerControls.tsx`
  - `src/components/search/search-ui.constants.ts`
- Headless result rendering:
  - `src/components/search/results/ResultListView.tsx`
  - `src/components/search/results/ResultItem.tsx`
  - `src/components/search/results/ResultCard.tsx`
  - `src/components/search/results/result-fields.ts`
- Headless facets:
  - `src/components/search/facets/FacetPanel.tsx`
- Sample response mode:
  - `src/components/search/response/SearchResponseResultList.tsx`
  - `src/components/search/response/SearchResponseFacetPanel.tsx`
  - `src/components/search/response/SearchResponsePagerControls.tsx`
  - `src/components/search/response/use-search-response-state.ts`
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

There is also a sample response path gated by feature flags. In that mode, `SearchExperience` bypasses Coveo initialization and renders JSON-backed results from `src/data/sample-coveo-search-response.json` plus insight content from `src/data/search-insights.json`.

The main architectural weakness is that `SearchExperience` is currently both composition root and search orchestration layer. UI components are coupled directly to Coveo Headless controller types, while sample-response components use a separate response-shaped model. That works for the current assessment surface, but it does not yet match the final execution-plan target of:

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

Coverage configuration in `vitest.config.ts` includes:

- `src/app/api/search-token/route.ts`
- `src/lib/coveo/search-token.ts`
- `src/components/search/SearchExperience.tsx`
- `src/components/search/results/result-fields.ts`
- `src/components/shared/ConfigurationNotice.tsx`

Coverage thresholds are enforced per file at 80% for statements, branches, functions, and lines.

Existing tests cover:

- Search token route success and failure behavior.
- Client search-token config fetch behavior.
- Server feature flag parsing.
- Search experience startup, configuration failure, query handoff, token renewal, and sample response mode.
- Result field extraction.
- Configuration notice rendering.

Documented gaps in `docs/testing.md` include direct DOM tests for Headless-driven child components such as `SearchBoxView`, `SearchSummary`, `PagerControls`, `FacetPanel`, `ResultItem`, and `ResultListView`.

## Risks

- Provider boundary is missing. UI code depends directly on Coveo Headless controllers, and the sample response path has separate response-specific components. That will become expensive if the project adds mock and live provider modes without a clear domain model.
- `SearchExperience.tsx` is carrying too many responsibilities: token loading, engine creation, controller construction, startup state, ready state, sample mode, layout, and error rendering.
- Search state is partly implicit in multiple Headless controller states. The startup path uses a discriminated union, but the broader search experience does not yet expose the explicit `initial/loading/success/empty/error/offline/partial` state model described in the execution plan.
- Sort UI is present but not functional. It displays relevance and a chevron, but no provider/controller sort state is wired.
- The Headless facet sidebar has a "Clear all" button that is not wired. Individual facet clear buttons are wired.
- Search suggestions render from Headless suggestions, but keyboard navigation and full ARIA combobox behavior are not complete.
- Analytics exists through Coveo Headless configuration and result click tracking with `buildInteractiveResult`, but submit, suggestion selection, facet, sort, and pagination analytics are not surfaced as explicit app-level events.
- Sample response mode is useful for demos, but it currently creates parallel UI paths instead of exercising the same provider/domain contract as live search.
- There is a stray `src/components/search/.DS_Store` local artifact in the working tree view. It should not be committed or used as part of the app.
- The application is not yet organized under `src/features/search`, `src/features/analytics`, or provider/service folders. For this assessment, that is acceptable only if future changes introduce boundaries incrementally instead of reorganizing folders for aesthetics.

## Recommended Changes

1. Introduce a narrow search domain model and provider interface before adding more UI behavior. This should be small and should not turn the app into a full backend search proxy.
2. Convert sample response mode into a mock provider path that returns the same domain model the UI consumes. This removes the split between Headless result components and sample-response components.
3. Extract Headless engine/controller setup out of `SearchExperience.tsx` into a focused hook or service boundary. Keep `SearchExperience` as composition and layout.
4. Add explicit search-state and generative-answer-state discriminated unions before expanding loading, empty, offline, partial, or answer streaming behavior.
5. Make the existing sort control real or remove it until it is real. Dead UI is worse than missing UI in an assessment because it signals shallow product thinking.
6. Wire Headless "Clear all" facet behavior and add URL synchronization only after the provider/state boundary is stable.
7. Improve `SearchBoxView` accessibility: full combobox roles, keyboard navigation, Escape behavior, suggestion loading state, and clearer submit/select analytics hooks.
8. Keep tests focused around provider mapping, state transitions, and pure result/facet logic before attempting broad browser-level Headless tests.
9. Keep the backend route limited to token minting unless assessment requirements explicitly change. A full search proxy would add operational surface without solving a current problem.
10. Remove local artifacts such as `.DS_Store` from the working tree and ensure the hook gate continues blocking generated or local files.
