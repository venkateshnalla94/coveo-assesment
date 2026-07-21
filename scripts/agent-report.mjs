import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { mkdirSync } from "node:fs";
import { changedFilesFromBase, commandOutput, trackedFiles } from "./quality-utils.mjs";

const reportType = process.argv[2];
const validReports = new Set(["code-review", "commit-review", "context", "demo-readiness"]);

if (!validReports.has(reportType)) {
  console.error(`Usage: node scripts/agent-report.mjs <${[...validReports].join("|")}>`);
  process.exit(1);
}

const outputIndex = process.argv.indexOf("--output");
const outputPath = outputIndex >= 0 ? process.argv[outputIndex + 1] : "";
const files = changedFilesFromBase(process.env.AGENT_BASE_SHA);
const allFiles = [...new Set([...trackedFiles(), ...files])];
const status = commandOutput("git", ["status", "--short"], { allowFailure: true }) || "clean";
const diffSummary = process.env.AGENT_BASE_SHA
  ? commandOutput("git", ["diff", "--stat", `${process.env.AGENT_BASE_SHA}...HEAD`, "--"], { allowFailure: true }) ||
    "No diff against base."
  : commandOutput("git", ["diff", "--stat", "HEAD", "--"], { allowFailure: true }) || "No diff against HEAD.";

const report = buildReport(reportType);

if (outputPath) {
  mkdirSync(outputPath.split("/").slice(0, -1).join("/") || ".", { recursive: true });
  writeFileSync(outputPath, report);
} else {
  process.stdout.write(report);
}

function buildReport(type) {
  if (type === "code-review") {
    return codeReviewReport();
  }

  if (type === "commit-review") {
    return commitReviewReport();
  }

  if (type === "context") {
    return contextReport();
  }

  return demoReadinessReport();
}

function codeReviewReport() {
  const appFiles = files.filter((file) => /^src\/.*\.(ts|tsx)$/.test(file));
  const riskyFiles = files.filter((file) => /(^|\/)(route|provider|runtime|analytics|logger|feature|profile)/i.test(file));
  const secretRisk = detectSecretRisk(files);

  return `# Code Review Report

## Verdict

${secretRisk.length > 0 ? "not-ready" : "review-required"}

This is a static local report. It does not replace human review or an external model-backed code-review agent.

## Blocking Issues

${secretRisk.length > 0 ? bullet(secretRisk) : "- None detected by static checks."}

## Important Issues

${appFiles.length > 0 ? "- Application code changed. Verify loading, empty, error, analytics, accessibility, and provider-boundary behavior manually or with tests." : "- No application code changes detected."}

## Suggestions

- Avoid stylistic review noise already enforced by ESLint.
- Keep any Phase 7 changes limited to automation, documentation, hooks, workflows, and agent prompts.

## Architecture

${riskyFiles.length > 0 ? bullet(riskyFiles.map((file) => `${file}: review provider/security/runtime boundary impact.`)) : "- No obvious architecture-boundary files changed."}

## Accessibility

- If UI changed, run Playwright accessibility checks through \`npm run test:e2e\`. Static report cannot inspect rendered DOM.

## Security

${secretRisk.length > 0 ? bullet(secretRisk) : "- No high-confidence secret pattern detected in changed files."}

## Performance

- If build, client runtime, or E2E paths changed, inspect \`npm run build\` output and Playwright runtime.

## Analytics

- If analytics files changed, verify no token, raw provider payload, or sensitive identifier is emitted.

## Test Gaps

- Required deterministic checks: \`npm run validate\`.
- Required full check before PR readiness: \`npm run validate:full\`.

## Demo Readiness

- Static status only. Run \`npm run agent:demo-readiness\` and \`npm run test:e2e\` for readiness evidence.

## Changed Files

${files.length > 0 ? bullet(files) : "- None"}
`;
}

function commitReviewReport() {
  const maybeGenerated = files.filter((file) =>
    /(^|\/)(\.next|node_modules|coverage|playwright-report|test-results|next-env\.d\.ts|tsconfig\.tsbuildinfo|\.DS_Store)/.test(
      file,
    ),
  );
  const docs = files.filter((file) => /^(README\.md|AGENTS\.md|docs\/|\.codex\/|\.github\/)/.test(file));
  const code = files.filter((file) => /^src\//.test(file));
  const secretRisk = detectSecretRisk(files);

  return `# Commit Review

## Message

- Use Conventional Commits: \`type(optional-scope): subject\`.
- Supported types: feat, fix, docs, test, refactor, perf, build, ci, chore, revert.

## Scope

${files.length > 0 ? bullet(files) : "- No changed files detected."}

## Unrelated Changes

${code.length > 0 && docs.length > 0 ? "- Mixed code and documentation changes. Confirm this is one cohesive Phase 7 automation change." : "- No obvious unrelated split detected by static checks."}

## Secret Risk

${secretRisk.length > 0 ? bullet(secretRisk) : "- No high-confidence secret pattern detected in changed files."}

## Test Coverage

- For automation changes, run \`npm run validate\`.
- For PR readiness, run \`npm run validate:full\`.

## Documentation

${docs.length > 0 ? "- Documentation or workflow context changed." : "- No documentation changes detected; verify whether command/workflow changes require docs."}

## Suggested Split

${files.length > 20 ? "- Consider splitting if this includes both automation mechanics and unrelated product behavior." : "- No split required by static file count alone."}

## Recommended Commit Message

\`ci(review): add Phase 7 quality automation\`

## Generated Files

${maybeGenerated.length > 0 ? bullet(maybeGenerated) : "- None detected."}

## Git Status

\`\`\`text
${status}
\`\`\`

## Diff Summary

\`\`\`text
${diffSummary}
\`\`\`
`;
}

function contextReport() {
  const staleRisks = [];
  const contextSensitive = files.filter((file) =>
    /^(src\/|package(-lock)?\.json|\.env\.example|\.github\/|\.githooks\/|scripts\/|playwright\.config\.ts|vitest\.config\.ts|eslint\.config\.mjs)/.test(
      file,
    ),
  );

  if (contextSensitive.length > 0 && !files.includes("README.md")) {
    staleRisks.push("README.md may need command, hook, CI, or setup updates.");
  }

  if (contextSensitive.length > 0 && !files.includes("docs/current-state.md")) {
    staleRisks.push("docs/current-state.md may need workflow/current-state updates.");
  }

  if (contextSensitive.length > 0 && !files.includes("docs/agent-workflows.md")) {
    staleRisks.push("docs/agent-workflows.md may need agent/workflow updates.");
  }

  return `# Context Consistency Report

## Current

- Changed files: ${files.length}
- Context-sensitive files: ${contextSensitive.length}

## Stale

${staleRisks.length > 0 ? bullet(staleRisks) : "- No stale documentation risk detected by static path checks."}

## Missing

${allFiles.includes("docs/agent-workflows.md") ? "- No required Phase 7 workflow document missing." : "- docs/agent-workflows.md is missing."}

## Suggested Updates

- Keep README validation commands aligned with \`package.json\`.
- Keep current-state documentation honest about report-only versus executable automation.
- Update ADRs only when the agent execution model or automation architecture creates a durable architecture decision.

## ADR Required

- Not required for routine CI/hook mechanics unless an external agent execution platform is adopted.

## Verdict

${staleRisks.length > 0 ? "needs-context-review" : "current"}
`;
}

function demoReadinessReport() {
  const hasE2E = allFiles.some((file) => file.startsWith("tests/e2e/"));
  const hasCi = allFiles.includes(".github/workflows/ci.yml");
  const hasSampleDefaults = read("playwright.config.ts").includes("COVEO_FEATURE_SAMPLE_SEARCH_RESPONSE");

  return `# Demo Readiness Report

## Overall Status

${hasE2E && hasCi && hasSampleDefaults ? "ready-with-notes" : "not-ready"}

This is a static readiness report. Final demo confidence still requires \`npm run validate:full\`.

## Blocking Issues

${hasE2E ? "- None detected by static checks." : "- No E2E suite detected."}

## Functional Readiness

- Search, suggestions, facets, sorting, pagination, zero-results, generative states, and trending content must be verified by Playwright.

## Accessibility

- Automated axe checks are expected in \`tests/e2e/accessibility.spec.ts\`.

## Responsive Readiness

- Responsive validation is expected in the Playwright suite.

## Security

- Demo must run without live Coveo credentials.
- Run \`npm run secrets:scan\` before publishing.

## Analytics

- Sample analytics must remain clearly local/mock.
- Live Coveo analytics claims must stay limited to confirmed Headless behavior.

## Storytelling

- Profile-specific story should be clear for developer documentation, customer support, ecommerce, and minimal profiles.

## Setup Reliability

${hasSampleDefaults ? "- Playwright config sets deterministic sample mode." : "- Sample-mode Playwright configuration not detected."}

## Mock vs Live Clarity

- Do not claim sample generated answers, trending metrics, or local feedback are live Coveo capabilities.

## Final Recommendation

- Run \`npm run validate:full\` at the end of Phase 7.
`;
}

function detectSecretRisk(targetFiles) {
  const findings = [];

  for (const file of targetFiles) {
    if (!existsSync(file) || file === ".env.example") {
      continue;
    }

    const text = read(file);
    const checks = [
      /\bCOVEO_PLATFORM_API_KEY[ \t]*=[ \t]*(?!["']?(?:$|changeme|replace-me|your-|example|placeholder|test|mock|fake|dummy|local|dev))["']?[^\s#]+/i,
      /\bCOVEO_ACCESS_TOKEN[ \t]*=[ \t]*(?!["']?(?:$|changeme|replace-me|your-|example|placeholder|test|mock|fake|dummy|local|dev))["']?[^\s#]+/i,
      /Authorization\s*:\s*Bearer\s+[A-Za-z0-9._~+/=-]{20,}/i,
      /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
    ];

    if (checks.some((pattern) => pattern.test(text))) {
      findings.push(`${file}: possible secret-like value. Remove it and rotate if real.`);
    }
  }

  return findings;
}

function bullet(items) {
  return items.map((item) => `- ${item}`).join("\n");
}

function read(file) {
  if (!existsSync(file)) {
    return "";
  }

  return readFileSync(file, "utf8");
}
