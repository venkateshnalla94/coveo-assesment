# Agent Workflow

Phase 7 details live in `docs/agent-workflows.md`. This file remains as the shorter lane overview.

Use these task lanes independently. Each lane has a clear owner boundary and validation target.

Report-only role prompts for these lanes live in `.codex/agents/`. The versions actually triggered in Claude Code are `.claude/agents/*.md` (gitignored, local-only) — adapted from the `.codex/agents/` prompts but able to act (edit files, run commands, create commits) instead of only reporting:

- `code-review-agent` reviews correctness, architecture, accessibility, security, performance, analytics, tests, and demo readiness. Report-only.
- `commit-agent` reviews the tree before commits, updates docs/tests as needed, and creates the commit itself.
- `test-agent` creates focused tests for changed code.
- `context-agent` updates docs directly when architecture, setup, workflow, or reviewer-facing context changes.
- `demo-readiness-agent` reviews setup reliability, mock/live clarity, functional readiness, and presentation risk. Report-only.
- `architecture-docs-agent` (no `.codex/agents/` counterpart) refreshes `outputs/architecture/*.md` after routing, component, or data-flow changes.

## 1. Repo Steward

Goal: keep the assessment readable for a cold reviewer.

- Maintain small commits with direct messages.
- Keep `.env.local` and generated build output out of git.
- Keep `README.md`, `AGENTS.md`, and `docs/agent-workflow.md` aligned with the actual app.
- Validate with `npm run validate` before local handoff and `npm run validate:full` before PR/demo readiness.
- Keep `.githooks/pre-commit` and `scripts/pre-commit-check.mjs` aligned with the documented workflow.
- Use `npm run workflow:check` for the CI-equivalent quality gate.
- Keep `.githooks/pre-push`, `.github/workflows/ci.yml`, and `.github/pull_request_template.md` aligned with merge expectations.

Done when: repo setup, scripts, docs, and git hygiene are correct.

Trigger: use `commit-agent` before every commit.

Hook: run `npm run hooks:install` once per clone so Git uses `.githooks/pre-commit` and `.githooks/pre-push`.

## 2. Coveo Auth Implementer

Goal: prove the secure read path works before UI polish.

- Own `src/app/api/search-token/route.ts`.
- Keep `COVEO_PLATFORM_API_KEY` server-side only.
- Enforce `searchHub`, optional `pipeline`, and user identity in the token payload.
- Return no cached token responses.

Done when: `/api/search-token` returns a token with valid env values and a safe error without them.

Trigger: ask `commit-agent` to review changes before commit. It must trigger `test-agent` if this route changed and no relevant tests were run or updated.

## 3. Headless Commerce Implementer

Goal: keep RoboMotion product discovery on the validated Headless Commerce path.

- Own `src/components/commerce/ProductDiscoveryExperience.tsx` and `src/features/commerce/headless/use-headless-commerce.ts`.
- Build the Commerce engine with the selected explicit auth mode.
- Configure token renewal.
- Register Commerce controllers before the first product search runs.
- Keep analytics enabled.

Done when: first product search executes, suggestions work, facets update, and pagination works.

Trigger: ask `commit-agent` to review changes before commit. It must trigger `context-agent` if the token-vs-direct-search boundary changed.

## 4. Search UI Implementer

Goal: deliver the minimum complete product surface.

- Own `SearchBox`, `SearchSuggestions`, `Pagination`, and Commerce product components.
- Keep every data-driven area covered by loading, empty, and error states.
- Use Headless Commerce controllers for product data.
- Keep RGA and Technical Resources isolated from product selection.

Done when: product search, suggestions, results, facets, pagination, comparison, and details work.

Trigger: ask `commit-agent` to review changes before commit. It must trigger `test-agent` for non-trivial logic changes that need focused Vitest coverage.

Coverage: current 80% thresholds are enforced for token handling and result-field logic. See `docs/testing.md` for UI paths not covered by unit tests yet.

## 5. Assessment Narrator

Goal: make the project story obvious in 15 minutes.

- Own README trade-offs and architecture wording.
- Explain token minting vs full proxy.
- Call out what is intentionally out of scope.
- Keep the "more time" section business-relevant, not resume-driven.

Done when: the repo can be reviewed cold without a live walkthrough.

Trigger: use `context-agent` when architecture, env vars, validation commands, or workflow expectations change.

## Pull Request Workflow

Use `.github/pull_request_template.md` for reviewer-facing merge context. A ready PR should include:

- A behavior-focused title.
- A short summary of what changed and why.
- Test commands and coverage summary.
- Configuration, deployment, and security impact.
- Known warnings or limitations.

GitHub Actions runs quality, E2E, and security jobs for pull requests and pushes to `main`. Local pre-push runs `npm run workflow:push`, which validates lint, typecheck, tests, coverage, build, and changed-file secret scanning before pushing.
