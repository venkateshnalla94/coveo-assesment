# ADR 0001: Search Provider Abstraction

## Status

Accepted

## Context

The app has two search data paths:

- A live Coveo Headless path that initializes browser-side controllers with a short-lived search token.
- A sample response path that renders JSON-backed demo data.

Before this decision, the sample response UI consumed the raw Coveo-shaped mock JSON contract directly. That made the UI brittle because every mock field name leaked into rendering and filtering behavior.

## Decision

Introduce a small search domain model and a `SearchProvider` interface.

The domain model includes:

- `SearchQuery`
- `SearchResponse`
- `SearchResult`
- `SearchFacet`
- `FacetValue`
- `SearchSuggestion`

The sample response path now uses `MockSearchProvider`, which maps raw Coveo-shaped fixture data into the domain model before UI components receive it.

Create a `CoveoSearchProvider` skeleton, but keep it inert in this phase. It must not accept privileged credentials in client code, and it must not replace the existing Headless controller path until a server-safe adapter design is implemented.

## Consequences

- Mock data has a clear boundary and can change without forcing UI components to know raw Coveo response fields.
- Provider mapping is unit-testable without mocking Coveo Headless controllers.
- The live Headless UI path remains unchanged for now to avoid coupling Phase 2 to deferred facets, suggestions, analytics, and pagination work.
- A future phase still needs to decide whether live Coveo data should flow through a domain provider, through controller adapters, or remain Headless-controller-driven with mapping at component boundaries.
