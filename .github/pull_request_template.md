## PR Title

Use a direct behavior-focused title.

Examples:

- `Add safe Coveo configuration fallback UI`
- `Enforce coverage in pre-commit workflow`
- `Improve result field rendering`

## Summary

- What changed:
- Why it changed:
- User/reviewer impact:

## Architecture And Security

- [ ] Keeps `COVEO_PLATFORM_API_KEY` server-side only.
- [ ] Preserves the thin token-minting route; does not turn the app into a search proxy.
- [ ] Uses Coveo Headless controllers for browser search UI state.
- [ ] Does not commit `.env.local`, generated output, local context, or real secrets.
- [ ] Documents any architecture, env var, command, or workflow change.

Notes:

## Tests And Coverage

Commands run:

```text
npm run lint
npm run test:coverage
npm run typecheck
npm run build
```

Coverage summary:

```text
Statements:
Branches:
Functions:
Lines:
```

Paths below 80% coverage, if any:

- None

## Configuration Changes

- New env vars:
- Changed env vars:
- Local setup impact:
- Deployment impact:

## Screenshots Or Evidence

Add screenshots, terminal output, or a short behavior note when the UI changes.

## Merge Checklist

- [ ] `commit-agent` reviewed the diff.
- [ ] `test-agent` ran or was intentionally skipped with a reason.
- [ ] `context-agent` ran when docs/workflow/setup/security changed.
- [ ] `npm run workflow:check` passed.
- [ ] Known warnings or limitations are listed below.

Known warnings or limitations:

- None
