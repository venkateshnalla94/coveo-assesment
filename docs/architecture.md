# Architecture

## Search

The secured live path remains unchanged:

```text
Browser UI -> /api/search-token -> Coveo token endpoint
Browser UI -> Coveo Search API with short-lived token
```

Sample mode uses `InMemorySearchProvider` over typed, profile-specific fixture data. Live mode still uses Coveo Headless controllers directly because replacing controller behavior without real Coveo validation would risk facets, suggestions, pagination, and existing usage analytics.

Sample-mode search state is synchronized with URL parameters:

- `q`
- `page`
- `sort`
- `contentType`
- `source`
- `product`

Invalid URL state is normalized with safe defaults. Live Headless mode is not forced into this URL model because Headless owns controller state and live routing has not been validated against a real Coveo organization.

## Runtime Configuration

Runtime configuration is resolved centrally in `src/lib/runtime/runtime-config.ts`.

Public runtime configuration:

- environment
- selected demo profile
- selected development scenario
- resolved feature flags
- provider capabilities
- non-secret Coveo metadata

Server-only configuration:

- `COVEO_PLATFORM_API_KEY`
- search token endpoint override
- user identity and identity provider

Feature flag resolution order is:

```text
base defaults -> environment overrides -> demo profile overrides -> development query overrides
```

Development query overrides are disabled in production.

## Demo Profiles

Profiles live outside UI components in `src/features/demo-profiles/demo-profiles.ts`. Profile fixture selection lives in `src/features/demo-profiles/profile-fixtures.ts`.

Supported profiles:

- `developer-documentation`
- `customer-support`
- `ecommerce`
- `minimal`

Unknown profile IDs fall back to `developer-documentation`.

Each profile supplies deterministic provider-driven data for results, suggestions, facets, trending content, and generative behavior where enabled. UI components consume provider contracts and do not branch on profile IDs.

## Provider Capabilities

Provider capabilities are explicit metadata, not inferred from class names.

Sample search capabilities:

- suggestions
- facets
- pagination
- app analytics
- relevance, newest, and most-popular sorting

Confirmed live Coveo Headless capabilities:

- suggestions
- facets
- pagination
- Headless-owned usage analytics
- relevance-only sorting

Live generative capabilities remain unavailable until a supported server-side Coveo generative integration is confirmed.

## Generative Answers

Generative answers use a separate `GenerativeProvider` boundary:

```text
Generative UI -> GenerativeProvider -> MockGenerativeProvider | CoveoGenerativeProvider skeleton
```

Sample mode uses deterministic fixture-backed answers and citations. Live mode does not fake generated answers. `CoveoGenerativeProvider` throws a typed configuration error until a supported server-side Coveo generative endpoint is available.

Feedback uses a separate `FeedbackProvider`; the current implementation is local/in-memory only.

## Trending Content

Trending content uses `TrendingProvider`. Current data is deterministic fixture content with explicit sample-mode language so mock view counts are not presented as production analytics.

## Analytics

App-level analytics use `AnalyticsProviderRoot` and `useAnalytics()`.

Local/sample mode uses `ConsoleAnalyticsProvider`. Live mode uses a `CoveoAnalyticsProvider` skeleton while Coveo Headless continues to own live usage analytics through engine configuration and `buildInteractiveResult`.

Analytics payloads must not include access tokens, privileged keys, or raw provider payloads.

## Error Handling and Observability

`ApplicationError` provides a shared error model across configuration, provider, timeout, network, validation, and unknown failures. Raw errors are mapped before rendering user-facing messages. Development diagnostics are allowed, but token-like metadata is sanitized.

`ConsoleLogger` and `NoopLogger` provide lightweight structured logging. Logging and analytics remain separate: logs are technical operational events, analytics are product interaction events.

## Development Scenarios

Typed scenarios are supported in development and test only:

- `default`
- `loading`
- `empty`
- `error`
- `partial`
- `generative`
- `generative-error`
- `generative-no-answer`
- `trending-empty`
- `trending-error`

Production ignores scenario query parameters.

## Phase 6 Quality Boundaries

`SearchExperience.tsx` remains the composition point, but sample provider construction is extracted into `useSampleExperienceProviders`. That keeps profile fixtures, optional generative/trending providers, feedback provider setup, and scenario-specific mock behavior out of the render component while avoiding a risky live Headless rewrite.

Request reliability uses lightweight primitives:

- Suggestions use `AbortController` plus request sequencing.
- Sample search uses `AbortController` plus request sequencing.
- Search token configuration fetch accepts an abort signal.
- Stale sample search and generative responses are prevented from replacing newer user state.

Security-sensitive boundaries:

- The token route redacts Coveo token-minting failure details before sending errors to the browser.
- Result, citation, and trending URLs are validated before rendering external links.
- Development query overrides remain unavailable in production.

Quality validation:

- Playwright E2E tests cover deterministic sample flows and credential-free live safety gates.
- `@axe-core/playwright` checks serious and critical accessibility violations.
- Responsive assertions cover `375x812`, `768x1024`, `1024x768`, and `1440x900`.
- No Phase 7 workflow, hook, PR, or CI automation was added as part of this phase.
