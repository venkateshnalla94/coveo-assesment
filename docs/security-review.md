# Security Review

## Confirmed Controls

- Anonymous mode uses only `NEXT_PUBLIC_COVEO_ANONYMOUS_SEARCH_API_KEY`.
- Search-token mode uses only server-side `COVEO_AUTHENTICATED_SEARCH_API_KEY`.
- `COVEO_PLATFORM_API_KEY` is server-side only for RGA, Technical Resources, and the conversational agent (`/api/coveo/conversation`).
- The conversational agent's answer text is untrusted model output rendered with `react-markdown` (`AgentMessage.tsx`); no `rehype-raw` plugin is wired in, so raw HTML in an answer is never rendered — only markdown syntax is. Answer-body links are forced to `target="_blank" rel="noreferrer"` before rendering, the only additional link surface it introduces.
- `/api/search-token` returns only a generated search token and non-secret configuration.
- Coveo token minting failures are redacted before returning to the browser.
- Token-like log metadata is sanitized by shared logger and error helpers.
- Authorization headers and raw access tokens are not logged by app code.
- User-controlled query values are rendered through React text nodes.
- The `/blog/[id]` article page renders one exception to plain-text rendering: the full Technical Resources article body, which is untrusted third-party HTML from an external blog source. It is sanitized server-side with `sanitize-html` (`fetchTrendingArticle` in `src/lib/coveo/content-search.ts`) — an allowlist of basic content tags/attributes, links forced to `target="_blank" rel="noopener noreferrer"` — before being rendered client-side with `dangerouslySetInnerHTML`. No other app code uses `dangerouslySetInnerHTML`.
- Product, citation, and resource URLs are validated before rendering navigable links.
- External links that open in a new tab use safe `rel` attributes.
- The product detail page's external "View Product" link reuses the existing `getSafeProductUrl` protocol allowlist (same helper used by the result card and details drawer) — no new URL-validation logic was introduced.
- The product detail page's sessionStorage handoff (`src/lib/commerce/product-session-cache.ts`) carries the same `ProductResult` the browser already fetched from Coveo for the active session, same-origin only; it is not user-controlled input and introduces no new trust boundary.
- `.env.example` contains placeholders only.
- Every response carries a `Content-Security-Policy` (default-src `'self'`, `connect-src` additionally scoped to `https://*.cloud.coveo.com https://*.org.coveo.com` for the browser-side Headless search-token flow), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and a `Permissions-Policy` denying geolocation/camera/microphone (`next.config.mjs`). `script-src` includes `'unsafe-inline'` because Next.js injects its own inline hydration/RSC-payload scripts on every page (verified via production build + Playwright: `script-src 'self'` alone blocks the app from hydrating at all); a stricter nonce-based policy would need per-request middleware, tracked as future work rather than attempted in this pass.
- `/api/search-token`, `/api/coveo/generative/answer`, `/api/coveo/conversation`, and `/api/coveo/content/search` — the four privileged, Coveo-calling routes — are each rate-limited per client IP (`src/lib/http/rate-limit.ts`, in-memory sliding window; noted there as needing a shared store for a multi-instance deployment) and time out their outbound Coveo fetches via `AbortSignal.timeout(...)` rather than hanging indefinitely.

## Tests

Security-focused tests cover:

- explicit anonymous and search-token credential boundaries
- unsafe citation and resource URLs
- article body HTML sanitization (script tags stripped, links forced to safe `target`/`rel`)
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
