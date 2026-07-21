# Agent Workflow

Use these task lanes independently. Each lane has a clear owner boundary and validation target.

Concrete triggerable agents live in `.codex/agents/`:

- `commit-agent` reviews the tree before commits and coordinates validation.
- `test-agent` creates focused tests for changed code.
- `context-agent` updates docs only when architecture, setup, workflow, or reviewer-facing context changes.

## 1. Repo Steward

Goal: keep the assessment readable for a cold reviewer.

- Maintain small commits with direct messages.
- Keep `.env.local` and generated build output out of git.
- Keep `README.md`, `AGENTS.md`, and `docs/agent-workflow.md` aligned with the actual app.
- Validate with `npm run lint`, `npm run test:coverage`, `npm run typecheck`, and `npm run build`.
- Keep `.githooks/pre-commit` and `scripts/pre-commit-check.mjs` aligned with the documented workflow.
- Use `npm run workflow:check` to validate the full dirty tree before staging.
- Keep `.githooks/pre-push`, `.github/workflows/ci.yml`, and `.github/pull_request_template.md` aligned with merge expectations.

Done when: repo setup, scripts, docs, and git hygiene are correct.

Trigger: use `.codex/agents/commit-agent.md` before every commit.

Hook: run `npm run hooks:install` once per clone so Git uses `.githooks/pre-commit` and `.githooks/pre-push`.

## 2. Coveo Auth Implementer

Goal: prove the secure read path works before UI polish.

- Own `src/app/api/search-token/route.ts`.
- Keep `COVEO_PLATFORM_API_KEY` server-side only.
- Enforce `searchHub`, optional `pipeline`, and user identity in the token payload.
- Return no cached token responses.

Done when: `/api/search-token` returns a token with valid env values and a safe error without them.

Trigger: ask `commit-agent` to review changes before commit. It must trigger `test-agent` if this route changed and no relevant tests were run or updated.

## 3. Headless Engine Implementer

Goal: initialize Coveo Headless once and let the browser query Coveo directly.

- Own `src/components/search/SearchExperience.tsx`.
- Build the engine with the generated token.
- Configure token renewal.
- Register controllers before the first search runs.
- Keep analytics enabled.

Done when: first search executes and controller state updates in the UI.

Trigger: ask `commit-agent` to review changes before commit. It must trigger `context-agent` if the token-vs-direct-search boundary changed.

## 4. Search UI Implementer

Goal: deliver the minimum complete product surface.

- Own `SearchBoxView`, `ResultListView`, `ResultItem`, `FacetPanel`, `PagerControls`, and `SearchSummary`.
- Keep every data-driven area covered by loading, empty, and error states.
- Use Headless controllers directly instead of raw Search API fetches.
- Log result clicks with `buildInteractiveResult`.

Done when: search, suggestions, results, facets, pagination, and click-through work.

Trigger: ask `commit-agent` to review changes before commit. It must trigger `test-agent` for non-trivial logic changes that need focused Vitest coverage.

Coverage: current 80% thresholds are enforced for token handling and result-field logic. See `docs/testing.md` for UI paths not covered by unit tests yet.

## 5. Assessment Narrator

Goal: make the project story obvious in 15 minutes.

- Own README trade-offs and architecture wording.
- Explain token minting vs full proxy.
- Call out what is intentionally out of scope.
- Keep the "more time" section business-relevant, not resume-driven.

Done when: the repo can be reviewed cold without a live walkthrough.

Trigger: use `.codex/agents/context-agent.md` when architecture, env vars, validation commands, or workflow expectations change.

## Pull Request Workflow

Use `.github/pull_request_template.md` for reviewer-facing merge context. A ready PR should include:

- A behavior-focused title.
- A short summary of what changed and why.
- Test commands and coverage summary.
- Configuration, deployment, and security impact.
- Known warnings or limitations.

GitHub Actions runs `npm run workflow:check` for pull requests and pushes to `main`. Local pre-push runs `npm run workflow:push`, which validates the full working tree before pushing.
