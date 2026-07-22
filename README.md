# Coveo Commerce Assessment

RoboMotion Product Discovery built with Next.js App Router, TypeScript, and Coveo Headless Commerce.

## Architecture

```text
RoboMotion Product Discovery -> @coveo/headless/commerce -> Coveo Commerce API
AI Product Guidance -> RGA
Technical Resources -> Search API
```

Product search, query suggestions, facets, pagination, and relevance sorting are handled by `@coveo/headless/commerce` in the browser. The direct Commerce proxy rollback path has been removed.

RGA and Technical Resources are intentionally separate from Commerce products:

- `src/app/api/coveo/generative/answer/route.ts` calls the Search API generated-answer stream for AI Product Guidance.
- `src/app/api/coveo/content/search/route.ts` calls the Search API for Technical Resources.
- RGA is technical guidance, not product recommendations.

## Auth Modes

`COVEO_AUTH_MODE` must be explicit.

- `anonymous-api-key`: Headless Commerce uses only `NEXT_PUBLIC_COVEO_ANONYMOUS_SEARCH_API_KEY` in the browser. This is the validated mode for public anonymous catalog discovery.
- `search-token`: Headless Commerce uses `/api/search-token`, which mints short-lived tokens using only the server-side `COVEO_AUTHENTICATED_SEARCH_API_KEY`.

There is no credential fallback. Anonymous mode never uses `COVEO_AUTHENTICATED_SEARCH_API_KEY`; search-token mode never uses `NEXT_PUBLIC_COVEO_ANONYMOUS_SEARCH_API_KEY`.

`COVEO_PLATFORM_API_KEY` is server-only and is used by RGA and Technical Resources. It must never be exposed through a `NEXT_PUBLIC_` variable.

## Confirmed Commerce Behavior

- Query `welding arm` returns 226 products in the validated Coveo organization.
- Query suggestions work through Headless Commerce.
- Confirmed facets: `ec_category`, `compatible_robot_series`, `ec_brand`, `ec_price`, and `ec_rating`.
- Price and rating are numerical range facets.
- Pagination works.
- Live sorting is relevance-only.
- Headless Commerce requests return HTTP 200.
- `/api/search-token` is not used in anonymous mode.
- Direct Commerce proxy requests are not used in the validated Headless path.

The UI does not fabricate payload, reach, precision, mounting, certification, datasheet, or product recommendation fields.

## Setup

```bash
npm install
cp .env.example .env.local
```

Required for anonymous mode:

```bash
COVEO_ORGANIZATION_ID=
COVEO_AUTH_MODE=anonymous-api-key
NEXT_PUBLIC_COVEO_ANONYMOUS_SEARCH_API_KEY=
COVEO_PLATFORM_API_KEY=
```

Required for search-token mode:

```bash
COVEO_ORGANIZATION_ID=
COVEO_AUTH_MODE=search-token
COVEO_AUTHENTICATED_SEARCH_API_KEY=
COVEO_PLATFORM_API_KEY=
```

Run locally:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Validation

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

`npm run validate` runs format check, lint, typecheck, coverage, and build. `npm run validate:full` adds Playwright E2E, dependency audit, and secret scanning.

Install the Playwright browser before the first E2E run:

```bash
npx playwright install chromium
```

## Security Notes

- `.env.local` is ignored by git.
- `.env.local` and `.env.production` are blocked by local hooks and secret scanning.
- Token route errors are redacted before returning to the browser.
- Result, citation, and resource URLs are validated before rendering navigable links.
- User-controlled query values are rendered through React text nodes.

## Known Warning

Builds can still show a Coveo Headless Webpack critical-dependency warning from the third-party package bundle. The app uses Webpack intentionally through `next dev --webpack` and `next build --webpack`.

## Documentation

- `docs/architecture.md`
- `docs/current-state.md`
- `docs/testing-strategy.md`
- `docs/security-review.md`
- `docs/performance-review.md`
