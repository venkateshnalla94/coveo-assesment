# AGENTS.md

This repository is a Coveo TME take-home assessment: a secured Coveo Headless search UI built with Next.js App Router and TypeScript.

## Commands

- `npm run dev` - start local Next.js development server.
- `npm run lint` - run ESLint.
- `npm run typecheck` - run TypeScript without emitting files.
- `npm run build` - production build.

## Architecture

- `src/app/api/search-token/route.ts` is the only backend path. It mints short-lived Coveo search tokens with the privileged API key.
- Browser code uses the generated token with `@coveo/headless` and calls Coveo Search API directly.
- Do not turn this into a full search proxy unless the assessment scope changes.
- Do not expose `COVEO_PLATFORM_API_KEY` to client code or any `NEXT_PUBLIC_` variable.

## Workflow

Use `docs/agent-workflow.md` for independent task lanes: repo stewardship, Coveo auth, Headless engine, UI, and assessment narrative.

## Standards

- Keep TypeScript strict.
- Prefer small Headless controller components over raw fetches.
- Treat loading, empty, and error states as required product behavior.
- Keep comments focused on decisions and security boundaries.
