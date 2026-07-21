# Testing

This repo uses Vitest for focused unit coverage around the logic that carries assessment risk.

## Commands

```bash
npm run test
npm run test:coverage
npm run workflow:check
```

`npm run test:coverage` enforces 80% coverage for:

- `src/app/api/search-token/route.ts`
- `src/lib/coveo/search-token.ts`
- `src/components/search/SearchExperience.tsx`
- `src/components/search/results/result-fields.ts`
- `src/components/shared/ConfigurationNotice.tsx`

## Current Gaps

Some Headless-driven child components are not under direct DOM test coverage yet:

- `src/components/search/SearchBoxView.tsx`
- `src/components/search/SearchSummary.tsx`
- `src/components/search/PagerControls.tsx`
- `src/components/search/facets/FacetPanel.tsx`
- `src/components/search/results/ResultItem.tsx`
- `src/components/search/results/ResultListView.tsx`

That is intentional for now. Meaningful tests for those paths require deeper Coveo Headless controller mocks or browser-level tests against a configured Coveo org. `SearchExperience` is covered with React Testing Library for startup behavior, safe configuration failure, query handoff, and token renewal.

## Pre-commit Hook

Install hooks with:

```bash
npm run hooks:install
```

`npm install` also runs the same installer through `prepare` when the repo has a `.git` directory.

The pre-commit hook blocks commits when staged files include local secrets, generated output, or ignored local context. For code and validation config changes, it runs:

```bash
npm run lint
npm run test:coverage
npm run typecheck
npm run build
```

Use `npm run workflow:check` to run the same checks against the full dirty tree before files are staged.

The pre-push hook runs:

```bash
npm run workflow:push
```

`workflow:push` validates the full working tree with the same checks as `workflow:check`.
