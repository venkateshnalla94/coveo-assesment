# Architecture

## Search

The secured live path remains unchanged:

```text
Browser UI -> /api/search-token -> Coveo token endpoint
Browser UI -> Coveo Search API with short-lived token
```

Sample mode uses `InMemorySearchProvider` over mapped fixture data. Live mode still uses Coveo Headless controllers directly because replacing controller behavior without real Coveo validation would risk facets, suggestions, pagination, and existing usage analytics.

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

Profiles live outside UI components in `src/features/demo-profiles/demo-profiles.ts`.

Supported profiles:

- `developer-documentation`
- `customer-support`
- `ecommerce`
- `minimal`

Unknown profile IDs fall back to `developer-documentation`.

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
