# Performance Review

## Measured

- `npm run build` verifies route size and bundling warnings.
- Playwright responsive checks cover layout overflow and usability.
- Unit and E2E tests cover cancellation, stale-response protection, facets, pagination, RGA, and Technical Resources.

## Current Mitigations

- Query suggestions use debounce, `AbortController`, and request sequencing.
- Headless Commerce snapshot updates are scheduled to avoid unnecessary synchronous UI churn.
- RGA and Technical Resources render independently from product results.
- Skeletons use stable dimensions to reduce layout shift.
- Loading announcements use status semantics.

## Remaining Concerns

- Headless Commerce is a client bundle dependency.
- Real Web Vitals require deployed telemetry; local checks only validate readiness.
- The known Coveo Headless Webpack critical-dependency warning remains.
