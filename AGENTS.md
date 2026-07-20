# AGENTS.md

This repository is a Coveo TME take-home assessment: a secured Coveo Headless search UI built with Next.js App Router and TypeScript.

## Commands

- `npm run dev` - start local Next.js development server.
- `npm run lint` - run ESLint.
- `npm run test` - run Vitest unit tests.
- `npm run test:coverage` - run Vitest with 80% coverage thresholds for testable app logic.
- `npm run typecheck` - run TypeScript without emitting files.
- `npm run build` - production build.
- `npm run hooks:install` - configure Git to use committed hooks from `.githooks`.
- `npm run workflow:check` - run the pre-commit workflow against the full dirty tree before staging.

## Architecture

- `src/app/api/search-token/route.ts` is the only backend path. It mints short-lived Coveo search tokens with the privileged API key.
- Browser code uses the generated token with `@coveo/headless` and calls Coveo Search API directly.
- Do not turn this into a full search proxy unless the assessment scope changes.
- Do not expose `COVEO_PLATFORM_API_KEY` to client code or any `NEXT_PUBLIC_` variable.

## Workflow

Use `docs/agent-workflow.md` for independent task lanes: repo stewardship, Coveo auth, Headless engine, UI, and assessment narrative.

Repo-local agent prompts live in `.codex/agents/`:

- Trigger `commit-agent` before committing. It reviews the tree, checks architecture fit, runs validation, and coordinates other agents.
- `commit-agent` must trigger `test-agent` when application code changed and tests have not been considered for the current diff.
- `commit-agent` must trigger `context-agent` before commit when architecture, env vars, commands, workflow, or reviewer-facing documentation may need updates.

## Standards

- Keep TypeScript strict.
- Prefer small Headless controller components over raw fetches.
- Treat loading, empty, and error states as required product behavior.
- Keep comments focused on decisions and security boundaries.
