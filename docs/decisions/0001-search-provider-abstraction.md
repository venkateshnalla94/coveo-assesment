# ADR 0001: Legacy Search Provider Abstraction

## Status

Superseded

## Context

An earlier phase introduced a generic search provider boundary for fixture-backed review. The final assessment architecture now uses RoboMotion Headless Commerce directly for product discovery.

## Decision

The generic provider boundary is no longer part of the runtime architecture. Shared UI controls remain only where Commerce uses them.

## Consequences

- Product discovery uses `@coveo/headless/commerce`.
- Technical guidance and content resources remain separate Search API concerns.
- Removed fixture-only provider code should not be reintroduced as a production fallback.
