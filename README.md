# Coveo Search Assessment

Secured Coveo Headless search UI built with Next.js App Router and TypeScript.

## What is Built

- Thin server route that mints short-lived Coveo search tokens.
- Browser-side Coveo Headless engine that queries Coveo Search API directly.
- Search box with query suggestions.
- Result list with click analytics through `buildInteractiveResult`.
- Configurable facets.
- Pagination.
- Sample-mode generated answer with fixture citations and local feedback.
- Fixture-backed trending content.
- Provider-independent app analytics abstraction with local console analytics.
- Typed hierarchical feature flags, demo profiles, URL state in sample mode, provider capability metadata, shared error mapping, runtime config parsing, and lightweight structured logging.
- Loading, empty, query error, retry, accessibility, responsive, and keyboard-tested states.
- Profile-specific sample fixtures for developer documentation, customer support, ecommerce, and minimal modes.
- Playwright E2E and axe accessibility validation.

## Architecture

```text
React app -> /api/search-token -> Coveo token endpoint
React app -> Coveo Search API directly with short-lived token
```

The backend is not a search proxy. It only protects the privileged authenticated-search API key and mints scoped tokens. Coveo already hosts and scales the Search API, query pipelines, ranking, and analytics. Proxying every query would add latency and operational ownership without value for this assessment.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create local env:

```bash
cp .env.example .env.local
```

3. Fill in:

```bash
COVEO_ORGANIZATION_ID=
COVEO_PLATFORM_API_KEY=
COVEO_SEARCH_HUB=
COVEO_PIPELINE=
COVEO_FACET_FIELDS=source,filetype
```

Optional feature flags:

```bash
COVEO_FEATURE_SAMPLE_SEARCH_RESPONSE=true
COVEO_FEATURE_FACETS=true
COVEO_FEATURE_FACET_CONTENT_TYPE=true
COVEO_FEATURE_FACET_SOURCE=true
COVEO_FEATURE_FACET_PRODUCT=true
COVEO_FEATURE_ANALYTICS=true
COVEO_FEATURE_ANALYTICS_EXPOSURE=true
COVEO_FEATURE_GENERATIVE_ENABLED=true
COVEO_FEATURE_GENERATIVE_CITATIONS=true
COVEO_FEATURE_GENERATIVE_FEEDBACK=true
COVEO_FEATURE_GENERATIVE_DISCLAIMER=true
COVEO_FEATURE_GENERATIVE_STREAMING=false
COVEO_FEATURE_TRENDING_ENABLED=true
NEXT_PUBLIC_DEMO_PROFILE=developer-documentation
COVEO_DEVELOPMENT_QUERY_OVERRIDES=true
```

Sample mode defaults to enabled on the server for local review. In sample mode, generated answers, citations, feedback, trending metrics, and app analytics are mocked or local-only.

Feature flag resolution order is:

```text
base defaults -> environment overrides -> demo profile overrides -> development query overrides
```

Development query overrides are ignored in production. Demo profiles are `developer-documentation`, `customer-support`, `ecommerce`, and `minimal`. Select a default profile with `NEXT_PUBLIC_DEMO_PROFILE`; in development, use `?profile=ecommerce`.

Sample-mode URL state supports `q`, `page`, `sort`, `contentType`, `source`, and `product`. Development-only URL parameters are `profile` and `scenario`. Supported scenarios are `default`, `loading`, `empty`, `error`, `partial`, `generative`, `generative-error`, `generative-no-answer`, `trending-empty`, and `trending-error`.

4. Run locally:

```bash
npm run dev
```

5. Open `http://localhost:3000`.

## Validation

```bash
npm run lint
npm run test
npm run test:coverage
npm run typecheck
npm run build
npm run test:e2e
npm audit
npm run workflow:check
```

Run `npm run test` for focused Vitest coverage around token handling and result rendering logic. Run `npm run test:coverage` to enforce the current 80% coverage threshold for testable application logic.

Install the Playwright browser before the first E2E run:

```bash
npx playwright install chromium
```

Run browser E2E tests with:

```bash
npm run test:e2e
```

Open Playwright UI mode with:

```bash
npm run test:e2e:ui
```

Install local Git hooks with:

```bash
npm run hooks:install
```

Run `npm run workflow:check` before staging when you want the same mechanical checks across the full dirty tree. The installed Git hooks run:

- `npm run workflow:precommit` before commits, scoped to staged changes.
- `npm run workflow:push` before pushes, scoped to the full working tree.

Pull requests use `.github/pull_request_template.md` to capture title quality, test coverage, configuration impact, security boundaries, and merge readiness. GitHub Actions runs `npm run workflow:check` on pull requests and pushes to `main`.

## Security Notes

- `COVEO_PLATFORM_API_KEY` is server-side only and must never be prefixed with `NEXT_PUBLIC_`.
- Public runtime configuration includes environment, selected demo profile, resolved feature flags, provider capabilities, and non-secret Coveo metadata only.
- Server-only configuration includes `COVEO_PLATFORM_API_KEY`, token endpoint overrides, and identity settings.
- `.env.local` is ignored by git.
- The browser receives only the generated search token and non-secret search configuration.
- Coveo token route failures are redacted before returning to the browser.
- Result links, generated-answer citations, and trending links validate external URLs before rendering navigable links.
- User-controlled query and URL parameter values are normalized and rendered through React text nodes.
- Generative live mode is not integrated with Coveo APIs in this phase. The live provider is a safe skeleton and does not expose access tokens or privileged credentials.
- Anonymous identity is used by default. A real application would resolve the signed-in user's security identity before minting the token.

## Trade-offs

- CSR is used for the first implementation to prioritize a complete working search flow.
- Facet fields are environment-driven because the assessment index fields are not known in this empty repo.
- The token route supports both current and legacy Coveo search token paths to reduce setup risk across org configurations.
- Local and production commands use Webpack because the current Turbopack build attempts to parse Coveo Headless package metadata as strict JSON.
- Provider capabilities are explicit. Sample mode supports suggestions, facets, pagination, and relevance/newest/popularity sorting. Live Coveo Headless currently exposes relevance-only sorting and does not expose live generative controls.
- Sample-mode URL synchronization is implemented. Live Headless routing is intentionally not forced through the sample URL state model.
- Sample provider orchestration is extracted from `SearchExperience.tsx`; live Headless controller setup remains in place until it can be validated with real Coveo credentials.
- The existing Coveo Headless Webpack critical-dependency warning may remain during build. It is not suppressed because the source is the third-party package bundle, not application code.

## Quality Documentation

- `docs/testing-strategy.md`
- `docs/accessibility.md`
- `docs/security-review.md`
- `docs/performance-review.md`

## More Time

- Add Headless SSR for first paint.
- Add did-you-mean, sort, and deeper facet coverage after inspecting real fields.
- Add live Coveo generative answer integration after supported endpoints and server-side credentials are confirmed.
- Persist generative feedback to a backend service.
- Add a search hub switcher to demonstrate relevance context changes.
- Broaden live Coveo browser tests after real credentials and indexed fields are available.
- Deploy to Vercel and add the live URL here.
