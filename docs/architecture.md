# Architecture

## Search

The secured live path remains unchanged:

```text
Browser UI -> /api/search-token -> Coveo token endpoint
Browser UI -> Coveo Search API with short-lived token
```

Sample mode uses `InMemorySearchProvider` over mapped fixture data. Live mode still uses Coveo Headless controllers directly because replacing controller behavior without real Coveo validation would risk facets, suggestions, pagination, and existing usage analytics.

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
