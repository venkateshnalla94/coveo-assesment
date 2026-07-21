# Testing Strategy

## Layers

- Unit and component tests use Vitest, jsdom, and React Testing Library.
- Coverage is enforced through `npm run test:coverage` with 80% per-file thresholds for included application logic.
- End-to-end tests use Playwright against the local Next.js app in sample mode. The default E2E suite does not require Coveo credentials.
- Accessibility checks use `@axe-core/playwright` and fail on serious or critical violations.

## Commands

```bash
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run build
npm run test:e2e
npm audit
```

Install the browser used by the E2E suite with:

```bash
npx playwright install chromium
```

Interactive Playwright debugging is available through:

```bash
npm run test:e2e:ui
```

## E2E Coverage

The Playwright suite covers:

- Basic sample search and URL synchronization.
- Query suggestions, arrow navigation, Enter selection, and Escape dismissal.
- Facets, sorting, clearing filters, and pagination.
- Zero-results recovery.
- Generative answer loading, citations, feedback, no-answer, and error states.
- Demo profiles for developer documentation, customer support, ecommerce, and minimal.
- Browser back and forward restoration in sample mode.
- Live safety without credentials: internal live routes fail safely when server-side credentials are absent and live sorting remains relevance-only.
- Responsive assertions at `375x812`, `768x1024`, `1024x768`, and `1440x900`.

## Accessibility

Automated accessibility checks run in Playwright using axe against:

- Default search page.
- Suggestions-open state.
- Results and facets.
- Zero-results state.
- Generative answer state.
- Technical resources.
- Minimal profile.

The suite fails on serious or critical violations. No global axe rules are disabled.

## Known Gaps

- The E2E suite uses deterministic sample fixtures by default. It intentionally does not require real Coveo credentials.
- RoboMotion product-discovery E2E uses the deterministic sample Commerce provider by default. Live Commerce validation is intentionally separate because it requires local credentials and external network access.
- Live Coveo behavior is covered only for safety gates that can be verified without secrets.
- No visual-regression platform is configured. Responsive checks assert layout usability and horizontal overflow instead of maintaining image baselines.
- Product comparison and product details drawers are covered by component tests and Playwright accessibility checks in sample mode.
