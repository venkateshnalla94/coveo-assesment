# Coveo Search Assessment

Secured Coveo Headless search UI built with Next.js App Router and TypeScript.

## What is Built

- Thin server route that mints short-lived Coveo search tokens.
- Browser-side Coveo Headless engine that queries Coveo Search API directly.
- Search box with query suggestions.
- Result list with click analytics through `buildInteractiveResult`.
- Configurable facets.
- Pagination.
- Loading, empty, and query error states.

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

4. Run locally:

```bash
npm run dev
```

5. Open `http://localhost:3000`.

## Security Notes

- `COVEO_PLATFORM_API_KEY` is server-side only and must never be prefixed with `NEXT_PUBLIC_`.
- `.env.local` is ignored by git.
- The browser receives only the generated search token and non-secret search configuration.
- Anonymous identity is used by default. A real application would resolve the signed-in user's security identity before minting the token.

## Trade-offs

- CSR is used for the first implementation to prioritize a complete working search flow.
- Facet fields are environment-driven because the assessment index fields are not known in this empty repo.
- The token route supports both current and legacy Coveo search token paths to reduce setup risk across org configurations.
- Production build uses `next build --webpack` because the current Turbopack build attempts to parse Coveo Headless package metadata as strict JSON.

## More Time

- Add Headless SSR for first paint.
- Add did-you-mean, sort, and deeper facet coverage after inspecting real fields.
- Add a search hub switcher to demonstrate relevance context changes.
- Add unit tests around config parsing and result field rendering.
- Deploy to Vercel and add the live URL here.
