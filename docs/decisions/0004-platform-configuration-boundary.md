# ADR 0004: Platform Configuration Boundary

## Status

Accepted

## Context

Phase 5 needs feature flags, demo profiles, URL state, runtime configuration, error mapping, observability, provider capabilities, and development scenarios. Adding each concern directly to UI components would make `SearchExperience` harder to maintain and would increase the risk of destabilizing the live Coveo Headless path.

## Decision

Create a typed platform boundary made of pure modules:

- Hierarchical `FeatureFlags` with deterministic resolution.
- Typed `DemoProfile` definitions outside UI components.
- Central `RuntimeConfig` with separate public and server-only configuration.
- Sample-mode URL state helpers for parsing, serialization, and normalization.
- Explicit provider capability metadata.
- Shared `ApplicationError` mapping.
- Lightweight structured logging.
- Typed development scenarios disabled in production.

Feature resolution order is:

```text
base defaults -> environment overrides -> demo profile overrides -> development query overrides
```

Development query overrides are allowed only outside production and only when explicitly enabled or running in development.

## Consequences

- UI components consume resolved configuration instead of reading environment variables.
- Public runtime config does not include private Coveo API keys or token endpoint credentials.
- Profile and scenario behavior can be tested without rendering the full application.
- Sample-mode URL synchronization is deterministic and does not force live Headless routing behavior.
- Provider capabilities replace some hard-coded sample/live assumptions, but Phase 5 deliberately avoids a major provider-path unification.
- Live Coveo sorting and live generative answers remain unavailable until supported configuration is confirmed.
