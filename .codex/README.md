# Codex Agent Setup

This directory defines repo-local agents for independent work lanes. Use these files as triggerable role prompts when working in this repository.

## Agents

- `agents/commit-agent.md` - reviews the working tree before commits, checks architecture fit, and coordinates validation.
- `agents/test-agent.md` - creates or updates focused unit tests for code changes.
- `agents/context-agent.md` - updates documentation only when a change affects architecture, setup, workflow, or reviewer-facing narrative.

## Default Flow

1. Code changes are implemented by the active coding agent.
2. Before commit, trigger `commit-agent`.
3. `commit-agent` inspects the diff, checks the planned Coveo architecture, and verifies no secret or generated-file leakage.
4. If code changed and `test-agent` has not already run for the current diff, `commit-agent` triggers `test-agent`.
5. If the diff changes architecture, setup, commands, env vars, or ownership boundaries, `commit-agent` triggers `context-agent`.
6. The Git pre-commit hook runs `npm run workflow:precommit` for mechanical enforcement.
7. Commit only after the required validation is complete or after explicitly documenting why a validation step could not run.

## Hooks

Install local hooks with:

```bash
npm run hooks:install
```

The committed `.githooks/pre-commit` hook runs lint, coverage, typecheck, build, staged whitespace checks, and a basic secret/generated-file gate. It cannot literally trigger Codex agents; it enforces the mechanical checks that agents are expected to request.

Use `npm run workflow:check` to run the same mechanical checks across the full dirty tree before staging.

## Non-Negotiables

- Keep `COVEO_PLATFORM_API_KEY` server-side only.
- Do not convert the app into a full search proxy unless the assessment scope explicitly changes.
- Use Coveo Headless controllers for search UI state instead of raw browser-side Search API calls.
- Keep generated files, `.env.local`, `.next/`, and internal `.claude/` context out of git.
