# Testing

This repo uses Vitest for focused unit and component coverage and Playwright for the active RoboMotion product discovery workflow.

## Commands

```bash
npm run test
npm run test:coverage
npm run test:e2e
npm run workflow:check
```

`npm run test:coverage` enforces 80% coverage for included application logic, including token handling, Headless Commerce mapping, shared search controls, product UI, RGA components, Technical Resources, logging, and runtime configuration.

## Current Gaps

Headless Commerce controller internals are best covered through browser-level validation because mocking the controller store too deeply would create false confidence. The unit boundary is the local mapper and UI behavior; the E2E boundary is live product discovery.

## Pre-commit Hook

Install hooks with:

```bash
npm run hooks:install
```

For code and validation config changes, the workflow checks run lint, coverage, typecheck, and build. Use `npm run workflow:check` to run the same checks against the full dirty tree before files are staged.
