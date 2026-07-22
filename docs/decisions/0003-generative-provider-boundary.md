# ADR 0003: Generative Provider Boundary

## Status

Accepted

## Context

Generated answers, citations, and feedback have different ownership from Commerce product search. Adding generated answers to the product discovery path would conflate separate capabilities and make live Coveo integration harder to reason about.

## Decision

Create a separate `GenerativeProvider` with:

```ts
generate(query: string): Promise<GenerativeAnswer | null>
```

Use a discriminated `GenerativeState` union for UI workflow state. `CoveoGenerativeProvider` calls the server-side RGA route, while test helpers can provide deterministic answer, no-answer, and error behavior.

Feedback is modeled behind a separate `FeedbackProvider` so persistence can be added later.

## Consequences

- Product discovery responsibilities stay narrow.
- The UI consumes normalized generative domain models, not raw provider payloads.
- RGA can demonstrate answer, no-answer, error, feedback, and citation behavior without claiming to recommend products.
- Live mode does not expose client-side privileged credentials.
