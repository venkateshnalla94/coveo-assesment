# Agent Workflows

Phase 7 adds deterministic local automation, GitHub-hosted checks, and report-only agent workflows. There is no external hosted AI agent runtime wired into this repository. Local `agent:*` commands generate Markdown reports from repository state and static heuristics.

## Local Hooks

Install hooks with:

```bash
npm run hooks:install
```

`npm install` also runs the installer through `prepare` when the clone has a `.git` directory.

Installed hooks:

- `pre-commit`: checks staged formatting, blocks forbidden local/generated paths, runs staged secret detection, and lints staged JavaScript and TypeScript files.
- `commit-msg`: validates Conventional Commits.
- `pre-push`: runs lint, typecheck, unit tests, coverage, build, and changed-file secret scanning.

The pre-commit hook does not run Playwright, coverage, or the production build. That is deliberate; those checks belong in pre-push, `validate:full`, and CI.

Emergency bypass:

```bash
git commit --no-verify
git push --no-verify
```

Bypass only for a genuine tool outage or emergency patch. It creates reviewer risk and must be explained in the PR.

## Commit Convention

Use Conventional Commits:

```text
type(optional-scope): subject
```

Supported types:

- `feat`
- `fix`
- `docs`
- `test`
- `refactor`
- `perf`
- `build`
- `ci`
- `chore`
- `revert`

Examples:

```text
feat(search): add Coveo facet adapter
fix(generative): guard invalid citation links
test(e2e): cover profile navigation
docs(architecture): document runtime configuration
ci(review): add pull-request quality gate
```

Scopes are optional. Issue numbers are not required.

## Validation Commands

Fast deterministic local validation:

```bash
npm run validate
```

Runs format check, lint, typecheck, coverage, and build.

Full PR/demo validation:

```bash
npm run validate:full
```

Runs `validate`, Playwright E2E, `npm audit`, and the repository secret scan.

Individual commands:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run build
npm run test:e2e
npm audit
npm run secrets:scan
```

## Secret Detection

Secret scanning runs in local hooks and CI. It checks for:

- `COVEO_ACCESS_TOKEN`
- `COVEO_PLATFORM_API_KEY`
- `Authorization: Bearer`
- private key blocks
- high-confidence token/key assignments
- blocked secret-bearing env files such as `.env.local` and `.env.production`

`.env.example` placeholders are allowed. Findings print file paths and remediation, not detected values.

Limitations: this is heuristic scanning. It can miss real secrets and flag non-secrets. It is not a replacement for disciplined secret handling or credential rotation after exposure.

## Local Agent Commands

```bash
npm run agent:code-review
npm run agent:commit-review
npm run agent:context
npm run agent:demo-readiness
```

These commands work without provider secrets or external model credentials. They produce report-only Markdown. They exit non-zero only for command usage errors, not for subjective review findings.

Agent definitions live in `.codex/agents/`. Shared guardrails live in `.github/agents/guardrails.md`.

## GitHub Workflows

`CI` runs on pull requests and pushes to `main`:

- Quality: format check, lint, typecheck, coverage, build.
- E2E: installs Playwright Chromium and runs sample-mode Playwright tests.
- Security: `npm audit` and secret scan.

`PR Review Agents` runs on opened, synchronized, reopened, and ready-for-review pull requests. It skips draft PRs. It uploads Markdown reports and updates one deduplicated PR comment for same-repository PRs. Forked PRs still get report artifacts but do not receive a write-token comment.

`Context Update Check` runs only when source, package, env example, workflow, hook, script, or validation configuration paths change. It is report-only and never commits documentation.

`Demo Readiness` runs manually, on `demo-readiness` labeled PRs, and on `demo/**` or `release/**` branch pushes. It runs full validation and produces a demo-readiness report. It does not run on every trivial commit.

## Security Model

Core CI uses:

```yaml
permissions:
  contents: read
```

The PR agent workflow adds `pull-requests: write` only to update a deduplicated comment, and only comments for same-repository PRs. Workflows do not use `pull_request_target` and do not require live Coveo credentials.

Default E2E runs in deterministic sample mode with:

```text
COVEO_FEATURE_SAMPLE_SEARCH_RESPONSE=true
COVEO_DEVELOPMENT_QUERY_OVERRIDES=true
```

## Guardrails

Agents must not print secrets, modify credentials, disable tests, lower coverage thresholds, suppress lint or TypeScript failures, claim mock behavior is live Coveo behavior, commit or push automatically, hide failed checks, or fabricate evidence.

See `.github/agents/guardrails.md` for the full list.
