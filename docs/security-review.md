# Security Review

## Confirmed Controls

- Anonymous mode uses only `NEXT_PUBLIC_COVEO_ANONYMOUS_SEARCH_API_KEY`.
- Search-token mode uses only server-side `COVEO_AUTHENTICATED_SEARCH_API_KEY`.
- `COVEO_PLATFORM_API_KEY` is server-side only for RGA and Technical Resources.
- `/api/search-token` returns only a generated search token and non-secret configuration.
- Coveo token minting failures are redacted before returning to the browser.
- Token-like log metadata is sanitized by shared logger and error helpers.
- Authorization headers and raw access tokens are not logged by app code.
- User-controlled query values are rendered through React text nodes.
- The app does not use `dangerouslySetInnerHTML`.
- Product, citation, and resource URLs are validated before rendering navigable links.
- External links that open in a new tab use safe `rel` attributes.
- `.env.example` contains placeholders only.

## Tests

Security-focused tests cover:

- explicit anonymous and search-token credential boundaries
- unsafe citation and resource URLs
- token-like log metadata redaction
- redacted search-token route failures
- secret scanning

## Dependency Audit

Run:

```bash
npm audit
```

Do not upgrade unrelated dependencies solely for low-risk transitive findings. Document future audit output with severity and reachability.

## Remaining Production Work

- Add production deployment controls for source maps, logging sinks, and platform-level secret access.
- Persist generative feedback to a backend service if feedback becomes product-critical.
