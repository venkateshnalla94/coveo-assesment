# AGENTS.md

This repository is a Coveo TME take-home assessment: a secured Coveo Headless search UI built with Next.js App Router and TypeScript.

## Commands

- `npm run dev` - start local Next.js development server.
- `npm run lint` - run ESLint.
- `npm run test` - run Vitest unit tests.
- `npm run test:coverage` - run Vitest with 80% coverage thresholds for testable app logic.
- `npm run typecheck` - run TypeScript without emitting files.
- `npm run build` - production build.
- `npm run validate` - run the standard local quality gate.
- `npm run validate:full` - run validation, Playwright E2E, audit, and secret scan.
- `npm run hooks:install` - configure Git to use committed hooks from `.githooks`.
- `npm run workflow:check` - run the CI quality gate locally.
- `npm run agent:code-review` - generate a report-only code review.
- `npm run agent:commit-review` - generate a report-only commit review.
- `npm run agent:context` - generate a report-only context consistency review.
- `npm run agent:demo-readiness` - generate a report-only demo readiness review.

## Architecture

- `src/app/api/search-token/route.ts` mints short-lived Coveo search tokens with the privileged API key for browser-side product search.
- Browser code uses the generated token with `@coveo/headless` and calls Coveo Search API directly for product search.
- `src/app/api/coveo/content/search/route.ts`, `src/app/api/coveo/generative/answer/route.ts`, and the `/blog/[id]` server-rendered page (via `src/lib/coveo/content-search.ts`) are narrow, content/RGA-support server paths that call Coveo directly with the server-only `COVEO_PLATFORM_API_KEY` — they are not a general search proxy.
- Do not turn any of these into a full search proxy unless the assessment scope changes.
- Do not expose `COVEO_PLATFORM_API_KEY` to client code or any `NEXT_PUBLIC_` variable.

## Workflow

Use `docs/additional/agent-workflow.md` for independent task lanes and `docs/additional/agent-workflows.md` for Phase 7 hooks, CI, PR automation, and report-only agent workflows.

Repo-local agent prompts live in `.codex/agents/`:

- Trigger `code-review-agent` when reviewing application or workflow changes.
- Trigger `commit-agent` before committing. It reviews message quality, tree hygiene, cohesive scope, secret risk, tests, and documentation.
- `commit-agent` must trigger `test-agent` when application code changed and tests have not been considered for the current diff.
- `commit-agent` must trigger `context-agent` before commit when architecture, env vars, commands, workflow, or reviewer-facing documentation may need updates.
- Trigger `demo-readiness-agent` before demo/release readiness checks.

## Standards

- Keep TypeScript strict.
- Prefer small Headless controller components over raw fetches.
- Treat loading, empty, and error states as required product behavior.
- Keep comments focused on decisions and security boundaries.
