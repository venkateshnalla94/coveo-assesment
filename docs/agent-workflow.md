# Agent Workflow

Use these task lanes independently. Each lane has a clear owner boundary and validation target.

## 1. Repo Steward

Goal: keep the assessment readable for a cold reviewer.

- Maintain small commits with direct messages.
- Keep `.env.local` and generated build output out of git.
- Keep `README.md`, `AGENTS.md`, and `CLAUDE.md` aligned with the actual app.
- Validate with `npm run lint`, `npm run typecheck`, and `npm run build`.

Done when: repo setup, scripts, docs, and git hygiene are correct.

## 2. Coveo Auth Implementer

Goal: prove the secure read path works before UI polish.

- Own `src/app/api/search-token/route.ts`.
- Keep `COVEO_PLATFORM_API_KEY` server-side only.
- Enforce `searchHub`, optional `pipeline`, and user identity in the token payload.
- Return no cached token responses.

Done when: `/api/search-token` returns a token with valid env values and a safe error without them.

## 3. Headless Engine Implementer

Goal: initialize Coveo Headless once and let the browser query Coveo directly.

- Own `src/components/search/SearchExperience.tsx`.
- Build the engine with the generated token.
- Configure token renewal.
- Register controllers before the first search runs.
- Keep analytics enabled.

Done when: first search executes and controller state updates in the UI.

## 4. Search UI Implementer

Goal: deliver the minimum complete product surface.

- Own `SearchBoxView`, `ResultListView`, `ResultItem`, `FacetPanel`, `PagerControls`, and `SearchSummary`.
- Keep every data-driven area covered by loading, empty, and error states.
- Use Headless controllers directly instead of raw Search API fetches.
- Log result clicks with `buildInteractiveResult`.

Done when: search, suggestions, results, facets, pagination, and click-through work.

## 5. Assessment Narrator

Goal: make the project story obvious in 15 minutes.

- Own README trade-offs and architecture wording.
- Explain token minting vs full proxy.
- Call out what is intentionally out of scope.
- Keep the "more time" section business-relevant, not resume-driven.

Done when: the repo can be reviewed cold without a live walkthrough.
