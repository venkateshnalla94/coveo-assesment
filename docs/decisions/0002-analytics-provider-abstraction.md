# ADR 0002: Analytics Provider Abstraction

## Status

Accepted

## Context

Phase 3 only had Coveo Headless analytics configuration and result click tracking. Sample mode had no app-level event layer, and UI components would have needed direct logging or direct Coveo calls to track Phase 4 behavior.

## Decision

Introduce a provider-independent analytics abstraction:

- `AnalyticsEvent`
- `AnalyticsEventName`
- `AnalyticsProvider`
- `AnalyticsProviderRoot`
- `useAnalytics()`

Sample mode uses `ConsoleAnalyticsProvider`. Live mode uses a `CoveoAnalyticsProvider` adapter skeleton while existing Headless usage analytics remain intact.

## Consequences

- UI components emit typed events without knowing the destination.
- Analytics can be disabled through feature flags.
- Timestamp generation is centralized.
- Live Coveo analytics are not falsely expanded beyond what Headless already supports.
- A future implementation can route events to Coveo, a data layer, or another destination without rewriting UI components.
