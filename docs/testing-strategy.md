# Testing Strategy

## Layers

- Vitest covers runtime config, auth boundaries, Headless Commerce mapping, product UI, RGA components, Technical Resources, logging, and security helpers.
- `npm run test:coverage` enforces 80% per-file thresholds for included application logic.
- Playwright covers the live RoboMotion product discovery workflow against the local Next.js app.
- Axe checks fail on serious or critical accessibility violations.

## Commands

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run build
npm run test:e2e
npm run validate
npm run secrets:scan
npm audit
```

Install Chromium before the first Playwright run:

```bash
npx playwright install chromium
```

## Unit And Component Coverage

Retained coverage includes:

- Headless Commerce mappers
- anonymous auth and search-token config boundaries
- products, summary, facets, price/rating ranges, pagination, and relevance sorting
- comparison and details drawer behavior
- RGA answer rendering, citations, feedback, errors, and no-answer states
- Technical Resources rendering and provider behavior
- error isolation
- security boundaries
- accessibility-oriented component behavior

Tests that only covered removed generic demo behavior were deleted.

## E2E Coverage

The Playwright suite covers:

- product discovery startup
- live query submission
- query suggestions through Headless Commerce
- facets and clearing filters
- pagination when available
- comparison drawer
- product details drawer
- isolated RGA and Technical Resources failures
- keyboard navigation
- responsive layouts at `375x812`, `768x1024`, `1024x768`, and `1440x900`
- axe accessibility checks for the core product discovery states

E2E no longer depends on runtime profiles, synthetic scenarios, sample search mode, or direct Commerce proxy routes.

## Known Gaps

- E2E requires valid local Coveo configuration for the live Headless Commerce path.
- There is no visual-regression service; responsive tests assert usability and horizontal overflow.
- Build may report the known Coveo Headless Webpack warning.
