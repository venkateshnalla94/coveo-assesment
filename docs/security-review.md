# Security Review

## Confirmed Controls

- `COVEO_PLATFORM_API_KEY` is server-side only and is never exposed through `NEXT_PUBLIC_` variables.
- `/api/search-token` returns only a generated search token and non-secret configuration.
- Coveo token minting failures are redacted before returning to the browser.
- Token-like log metadata is sanitized by the shared logger/error helpers.
- Authorization headers and raw access tokens are not logged by app code.
- User-controlled query values are rendered through React text nodes, not HTML injection.
- The app does not use `dangerouslySetInnerHTML`.
- Result links, generative citations, and trending links validate external URLs before rendering navigable links.
- External links that open in a new tab use safe `rel` attributes.
- Runtime URL parameters are normalized before use.
- Development scenario/profile/query overrides are rejected in production.
- `.env.example` contains placeholders only.
- Sample fixtures contain demo content only and no secrets.

## Tests

Security-focused tests cover:

- Unsafe result, citation, and trending URLs.
- Malformed query parameters.
- Token-like log metadata redaction.
- Production rejection of development overrides.
- Redacted search-token route failures.

## Dependency Audit

Run:

```bash
npm audit
```

Phase 6 result: `npm audit` completed with `0 vulnerabilities`.

Do not upgrade unrelated dependencies solely for low-risk transitive findings. Document any future audit output with severity and reachability.

## Remaining Production Work

- Live Coveo generative answers are intentionally not integrated until a supported server-side endpoint and credential model are confirmed.
- Generative feedback persistence is local/in-memory only.
- A production deployment should validate source-map exposure, logging sinks, and platform-level secret access.
