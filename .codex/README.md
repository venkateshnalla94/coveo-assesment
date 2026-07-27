# Codex Agent Setup

This directory defines repo-local agents for independent work lanes. Use these files as triggerable role prompts when working in this repository.

## Agents

- `agents/commit-agent.md` - reviews the working tree before commits, checks architecture fit, and coordinates validation.
- `agents/test-agent.md` - creates or updates focused unit tests for code changes.
- `agents/context-agent.md` - updates documentation only when a change affects architecture, setup, workflow, or reviewer-facing narrative.
- `agents/code-review-agent.md` - report-only code review for correctness, architecture, security, accessibility, performance, analytics, tests, and demo readiness.
- `agents/demo-readiness-agent.md` - report-only demo readiness review.

## Default Flow

1. Code changes are implemented by the active coding agent.
2. Before commit, trigger `commit-agent`.
3. `commit-agent` inspects the diff, checks the planned Coveo architecture, and verifies no secret or generated-file leakage.
4. If code changed and `test-agent` has not already run for the current diff, `commit-agent` triggers `test-agent`.
5. If the diff changes architecture, setup, commands, env vars, or ownership boundaries, `commit-agent` triggers `context-agent`.
6. The Git pre-commit hook runs staged formatting, staged secret detection, and staged linting.
7. The Git commit-msg hook validates Conventional Commits.
8. The Git pre-push hook runs lint, typecheck, tests, coverage, build, and changed-file secret scanning.
9. GitHub Actions runs quality, E2E, security, PR-agent, context, and optional demo-readiness workflows.
9. Commit only after the required validation is complete or after explicitly documenting why a validation step could not run.

## Hooks

Install local hooks with:

```bash
npm run hooks:install
```

The committed `.githooks/pre-commit` hook is intentionally fast and staged-file oriented. The committed `.githooks/pre-push` hook runs the heavier deterministic checks. Hooks cannot literally trigger Codex agents; they enforce the mechanical checks that agents are expected to request.

Use `npm run validate` for local quality validation and `npm run validate:full` before PR or demo readiness.

Pull requests use `.github/pull_request_template.md` to capture behavior, provider impact, feature flags, testing, security, analytics, demo impact, and documentation. See `docs/additional/agent-workflows.md` for workflow details.

## Non-Negotiables

- Keep `COVEO_PLATFORM_API_KEY` server-side only.
- Do not convert the app into a full search proxy unless the assessment scope explicitly changes.
- Use Coveo Headless controllers for search UI state instead of raw browser-side Search API calls.
- Keep generated files, `.env.local`, `.next/`, and internal `.claude/` context out of git.
