# ADR 0003: Generative Provider Boundary

## Status

Accepted

## Context

Phase 4 requires generated answers, citations, feedback, and clear mock/live separation. The existing `SearchProvider` already handles search results, suggestions, facets, sorting, and pagination. Adding generated answers to that interface would conflate separate capabilities and make live Coveo integration harder to reason about.

## Decision

Create a separate `GenerativeProvider` with:

```ts
generate(query: string): Promise<GenerativeAnswer | null>
```

Use a discriminated `GenerativeState` union for UI workflow state. Add `MockGenerativeProvider` for deterministic sample behavior and `CoveoGenerativeProvider` as a safe skeleton that throws a typed configuration error.

Feedback is modeled behind a separate `FeedbackProvider` so persistence can be added later.

## Consequences

- Search provider responsibilities stay narrow.
- The UI consumes normalized generative domain models, not raw provider payloads.
- Sample mode can demonstrate answer, no-answer, error, feedback, and citation behavior.
- Live mode does not fabricate answers or expose client-side credentials.
