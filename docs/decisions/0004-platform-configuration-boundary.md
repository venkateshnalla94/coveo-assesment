# ADR 0004: Runtime Configuration Boundary

## Status

Updated

## Context

The final application needs explicit Coveo auth mode selection, public/server-only credential separation, feature flags, error handling, observability, and security-conscious runtime parsing.

## Decision

Keep a central runtime configuration boundary in `src/lib/runtime/runtime-config.ts`.

It resolves:

- environment
- feature flags
- Coveo auth mode
- non-secret organization metadata
- configured credential presence

It does not own product fixtures, synthetic runtime branches, or obsolete generic search state.

## Consequences

- Public runtime config does not include private Coveo API keys.
- Anonymous Commerce mode uses only the public anonymous key.
- Search-token mode uses only the authenticated server key.
- Removed rollback and fixture paths cannot be activated through configuration.
