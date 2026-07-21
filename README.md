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
- Fixture-backed technical resources in sample mode and Search API-backed technical resources in live product-discovery mode.
- Provider-independent app analytics abstraction with local console analytics.
- Typed hierarchical feature flags, demo profiles, URL state in sample mode, provider capability metadata, shared error mapping, runtime config parsing, and lightweight structured logging.
- Loading, empty, query error, retry, accessibility, responsive, and keyboard-tested states.
- Profile-specific sample fixtures for developer documentation, customer support, ecommerce, and minimal modes.
- Playwright E2E and axe accessibility validation.
- Phase 7 local Git hooks, Conventional Commit validation, GitHub CI, PR report automation, context checks, demo-readiness workflow, and report-only local agent commands.
- RoboMotion Industries product discovery experience backed by a Commerce product provider boundary, deterministic sample Commerce provider, product grid, real Commerce facets, range facets, local comparison, product details drawer, and technical guidance/resources rail.

## Architecture

```text
React app -> /api/search-token -> Coveo token endpoint
React app -> Coveo Search API directly with short-lived token
```

The backend is not a search proxy. It only protects the privileged authenticated-search API key and mints scoped tokens. Coveo already hosts and scales the Search API, query pipelines, ranking, and analytics. Proxying every query would add latency and operational ownership without value for this assessment.

The RoboMotion product experience uses a separate secure Commerce route:

```text
Product UI -> /api/coveo/commerce/search -> Coveo Commerce Search API
```

The server route keeps `COVEO_PLATFORM_API_KEY` server-side, sends Commerce context, and maps returned products into a product domain model before client UI renders them. Supporting technical content and generated guidance remain separate from Commerce product search.

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

RoboMotion Commerce configuration:

```bash
COVEO_COMMERCE_SEARCH_ENDPOINT=https://platform-eu.cloud.coveo.com/rest/organizations/robomotionindustriesp0bp5xin/commerce/v2/search
COVEO_COMMERCE_TRACKING_ID=robomotion
COVEO_COMMERCE_LANGUAGE=en
COVEO_COMMERCE_COUNTRY=GB
COVEO_COMMERCE_CURRENCY=GBP
COVEO_SEARCH_API_BASE_URL=https://platform-eu.cloud.coveo.com/rest/search/v2
COVEO_QUERY_SUGGEST_SEARCH_HUB=robomotion
COVEO_QUERY_SUGGEST_PIPELINE=cmh-search-robomotion-05bd0bce
COVEO_RGA_SEARCH_HUB=robomotion
COVEO_RGA_PIPELINE=default
COVEO_CONTENT_SEARCH_HUB=robomotion
COVEO_CONTENT_PIPELINE=default
```

Commerce facets are returned by the Commerce API and mapped in application code; they are not configured through `COVEO_FACET_FIELDS`.

For real browser testing, set `COVEO_FEATURE_SAMPLE_SEARCH_RESPONSE=false`. Products call `/api/coveo/commerce/search`, query suggestions call `/api/coveo/commerce/suggestions`, RGA calls `/api/coveo/generative/answer`, and technical resources call `/api/coveo/content/search`. All four routes keep `COVEO_PLATFORM_API_KEY` server-side.

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

Development query overrides are ignored in production. Demo profiles are `industrial-product-discovery`, `developer-documentation`, `customer-support`, `ecommerce`, and `minimal`. The default profile is `industrial-product-discovery`. Select another profile with `NEXT_PUBLIC_DEMO_PROFILE`; in development, use `?profile=ecommerce`.

Sample-mode URL state supports `q`, `page`, `sort`, `contentType`, `source`, and `product`. Development-only URL parameters are `profile` and `scenario`. Supported scenarios are `default`, `loading`, `empty`, `error`, `partial`, `generative`, `generative-error`, `generative-no-answer`, `trending-empty`, and `trending-error`.

4. Run locally:

```bash
npm run dev
```

5. Open `http://localhost:3000`.

## Validation

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run build
npm run validate
npm run test:e2e
npm audit
npm run validate:full
```

Run `npm run validate` for the standard local quality gate: format check, lint, typecheck, coverage, and build. Run `npm run validate:full` before PR or demo readiness: it adds Playwright E2E, dependency audit, and secret scanning.

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

The installed Git hooks run:

- `pre-commit`: staged formatting, forbidden path detection, staged secret scanning, and staged linting.
- `commit-msg`: Conventional Commit validation.
- `pre-push`: lint, typecheck, unit tests, coverage, build, and changed-file secret scanning.

Pre-push intentionally does not run Playwright. Run `npm run test:e2e` or `npm run validate:full` before opening or updating a PR.

Local report-only agent commands:

```bash
npm run agent:code-review
npm run agent:commit-review
npm run agent:context
npm run agent:demo-readiness
```

These commands do not require live Coveo credentials or an external model runtime. They generate static Markdown reports and do not modify code, commit, or push.

Pull requests use `.github/pull_request_template.md` to capture provider impact, feature flags, testing, security, analytics, demo impact, architecture impact, and documentation. GitHub Actions runs quality, E2E, and security jobs on pull requests and pushes to `main`.

Additional workflows:

- `PR Review Agents`: report-only code, commit, and context reports; skips draft PRs.
- `Context Update Check`: path-filtered report-only documentation consistency check.
- `Demo Readiness`: manual, `demo-readiness` label, or `demo/**` and `release/**` branch check.

See `docs/agent-workflows.md` for hook behavior, commit convention, CI permissions, fork PR behavior, and bypass guidance.

## Security Notes

- `COVEO_PLATFORM_API_KEY` is server-side only and must never be prefixed with `NEXT_PUBLIC_`.
- Public runtime configuration includes environment, selected demo profile, resolved feature flags, provider capabilities, and non-secret Coveo metadata only.
- Server-only configuration includes `COVEO_PLATFORM_API_KEY`, token endpoint overrides, and identity settings.
- `.env.local` is ignored by git.
- `.env.local` and `.env.production` are blocked by local hooks and secret scanning.
- The browser receives only the generated search token and non-secret search configuration.
- The browser never receives `COVEO_PLATFORM_API_KEY` for Commerce search, query suggestions, RGA, or technical resources; live calls go through internal `/api/coveo/*` routes.
- Coveo token route failures are redacted before returning to the browser.
- Result links, generated-answer citations, and trending links validate external URLs before rendering navigable links.
- User-controlled query and URL parameter values are normalized and rendered through React text nodes.
- RoboMotion live RGA is integrated through `/api/coveo/generative/answer` using Search API generated-answer streaming. It is positioned as technical guidance, not product recommendation.
- Anonymous identity is used by default. A real application would resolve the signed-in user's security identity before minting the token.
- Secret scanning is heuristic. It reduces obvious mistakes but does not guarantee secrets are absent.

## Trade-offs

- CSR is used for the first implementation to prioritize a complete working search flow.
- Facet fields are environment-driven because the assessment index fields are not known in this empty repo.
- The token route supports both current and legacy Coveo search token paths to reduce setup risk across org configurations.
- Local and production commands use Webpack because the current Turbopack build attempts to parse Coveo Headless package metadata as strict JSON.
- Provider capabilities are explicit. Sample mode supports suggestions, facets, pagination, and relevance/newest/popularity sorting. Live Commerce product discovery exposes relevance-only product sorting and server-backed live suggestions/RGA/resources. The generic live Coveo Headless content path still exposes relevance-only sorting.
- Sample-mode URL synchronization is implemented. Live Headless routing is intentionally not forced through the sample URL state model.
- Sample provider orchestration is extracted from `SearchExperience.tsx`; live Headless controller setup remains in place until it can be validated with real Coveo credentials.
- The existing Coveo Headless Webpack critical-dependency warning may remain during build. It is not suppressed because the source is the third-party package bundle, not application code.
- Local and GitHub agent automation is report-only unless a real external agent execution runtime is introduced later.
- Live Commerce sorting is relevance-only because Commerce returned only `sort.availableSorts: [{ sortCriteria: "relevance" }]`.
- Confirmed product fields include product ID, name, descriptions, brand, category, image, price, promo price, stock, rating, item group, product URL, compatible robot series, compatible robots, compatible joints, and compatible part SKUs.
- Payload, reach, precision, mounting type, industry, certification, controller compatibility, and datasheet URL are not confirmed structured Commerce fields and are not shown as authoritative comparison specs.

## Quality Documentation

- `docs/testing-strategy.md`
- `docs/accessibility.md`
- `docs/security-review.md`
- `docs/performance-review.md`
- `docs/agent-workflows.md`

## More Time

- Add Headless SSR for first paint.
- Add did-you-mean, sort, and deeper facet coverage after inspecting real fields.
- Add live Coveo generative answer integration after supported endpoints and server-side credentials are confirmed.
- Persist generative feedback to a backend service.
- Add a search hub switcher to demonstrate relevance context changes.
- Broaden live Coveo browser tests after real credentials and indexed fields are available.
- Deploy to Vercel and add the live URL here.
