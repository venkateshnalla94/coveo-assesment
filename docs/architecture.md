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

## Commerce Product Discovery

RoboMotion product search uses a separate product-focused provider boundary:

```text
ProductDiscoveryExperience
  -> CommerceProductProvider
  -> /api/coveo/commerce/search
  -> Coveo Commerce Search API
```

The Commerce API key is read only by the server route. Client UI sends normalized product search requests with `query`, `page`, `perPage`, and selected product facets. The response is mapped centrally into `ProductResult`, `ProductFacet`, and `ProductPagination` models before rendering.

Confirmed live Commerce sort support is relevance-only. The UI does not expose price, rating, name, newest, payload, reach, or precision sorting for live Commerce mode.

Confirmed Commerce facets are `ec_category`, `compatible_robot_series`, `ec_brand`, `ec_price`, and `ec_rating`. Price and rating are modeled as numerical range facets.

Supporting technical resources and generated guidance are intentionally separate from Commerce product search. RGA/blog content can explain selection criteria, but the UI must not claim that RGA chose specific Commerce products.

Live RoboMotion supporting paths use separate server routes:

```text
SearchBox suggestions -> /api/coveo/commerce/suggestions -> Coveo Search API querySuggest with the Commerce query pipeline
AI Product Guidance -> /api/coveo/generative/answer -> Coveo Search API RGA stream
Technical Resources -> /api/coveo/content/search -> Coveo Search API
```

These routes use the server-side platform key and return normalized domain data to the browser.

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

- `industrial-product-discovery`
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

Technical resources use `TrendingProvider`. Sample mode is deterministic fixture content with explicit sample-mode language; live RoboMotion mode uses Search API content results and does not present fixture metrics as production analytics.

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
