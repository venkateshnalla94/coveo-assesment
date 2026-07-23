# CLAUDE.md

This repository is a Coveo TME take-home assessment: a secured Coveo Headless search UI built with Next.js App Router and TypeScript.

## Commands

- `npm run dev` - start local Next.js development server.
- `npm run lint` - run ESLint.
- `npm run typecheck` - run TypeScript without emitting files.
- `npm run build` - production build.

## Architecture

- `src/app/api/search-token/route.ts` mints short-lived Coveo search tokens with the privileged API key for browser-side product search.
- Browser code uses the generated token with `@coveo/headless` and calls Coveo Search API directly for product search.
- `src/app/api/coveo/content/search/route.ts`, `src/app/api/coveo/generative/answer/route.ts`, and the `/blog/[id]` server-rendered page (via `src/lib/coveo/content-search.ts`) are narrow, content/RGA-support server paths that call Coveo directly with the server-only `COVEO_PLATFORM_API_KEY` — they are not a general search proxy.
- Do not turn any of these into a full search proxy unless the assessment scope changes.
- Do not expose `COVEO_PLATFORM_API_KEY` to client code or any `NEXT_PUBLIC_` variable.

## Workflow

Use `docs/agent-workflow.md` for independent task lanes: repo stewardship, Coveo auth, Headless engine, UI, and assessment narrative.

This repo also defines Claude subagents at `.claude/agents/*.md` (gitignored, local-only), adapted from the report-only Codex role prompts at `.codex/agents/*.md` but able to act:

- Trigger `commit-agent` before committing. It classifies the change as architectural or UI-only, updates docs when architectural, delegates to `test-agent` when application logic lacks test coverage, runs the validation gate, and creates the commit itself — with no AI co-author trailer.
- `commit-agent` triggers `test-agent` when application code changed and the diff has no corresponding test changes.
- `commit-agent` (or a direct request) triggers `context-agent` for larger or ambiguous documentation drift.
- Trigger `code-review-agent` for a report-only second opinion on application or workflow changes; it does not edit code.
- Trigger `demo-readiness-agent` before demo/release readiness checks; it does not edit `docs/demo-readiness-report.md` itself.

## Standards

- Keep TypeScript strict.
- Prefer small Headless controller components over raw fetches.
- Treat loading, empty, and error states as required product behavior.
- Keep comments focused on decisions and security boundaries.
