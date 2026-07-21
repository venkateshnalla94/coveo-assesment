import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
  });

  if (result.status !== 0 && !options.allowFailure) {
    process.exit(result.status ?? 1);
  }

  return result.stdout ?? "";
}

function fail(message) {
  console.error(`\npre-commit failed: ${message}`);
  process.exit(1);
}

const checkAllChanges = process.argv.includes("--all");
const diffTargetArgs = checkAllChanges ? ["diff", "--name-only", "--diff-filter=ACMR", "HEAD", "--"] : [
  "diff",
  "--cached",
  "--name-only",
  "--diff-filter=ACMR",
];

const changedFiles = run("git", diffTargetArgs, { capture: true })
  .split("\n")
  .map((file) => file.trim())
  .filter(Boolean);

if (checkAllChanges) {
  const untrackedFiles = run("git", ["ls-files", "--others", "--exclude-standard"], { capture: true })
    .split("\n")
    .map((file) => file.trim())
    .filter(Boolean);

  changedFiles.push(...untrackedFiles);
}

const uniqueChangedFiles = [...new Set(changedFiles)];

if (uniqueChangedFiles.length === 0) {
  process.exit(0);
}

const forbiddenPaths = [
  /^\.env($|\.|\/)(?!example$)/,
  /^\.claude\//,
  /^\.next\//,
  /^node_modules\//,
  /^next-env\.d\.ts$/,
  /^tsconfig\.tsbuildinfo$/,
];

const forbiddenFile = uniqueChangedFiles.find((file) => forbiddenPaths.some((pattern) => pattern.test(file)));

if (forbiddenFile) {
  fail(`refusing to commit generated, local, or secret-bearing path: ${forbiddenFile}`);
}

const stagedDiff = run("git", checkAllChanges ? ["diff", "HEAD", "--"] : ["diff", "--cached", "--"], {
  capture: true,
});
const untrackedText = checkAllChanges
  ? uniqueChangedFiles
      .filter((file) => !run("git", ["ls-files", "--error-unmatch", file], { capture: true, allowFailure: true }))
      .map((file) => readTextIfSmall(file))
      .join("\n")
  : "";
const secretPatterns = [
  /^[+ \t]*COVEO_PLATFORM_API_KEY[ \t]*=[ \t]*[^ \t\r\n]+/m,
  /Authorization:\s*Bearer\s+(?!\$\{)[A-Za-z0-9._-]{20,}/,
  /^[+ \t]*(api[_-]?key|apiKey)[ \t]*[:=][ \t]*["'][^"']{20,}["']/im,
];

if (secretPatterns.some((pattern) => pattern.test(`${stagedDiff}\n${untrackedText}`))) {
  fail("changed files look like they may contain a real API key or bearer token");
}

const docsChanged = uniqueChangedFiles.some((file) =>
  /^(README\.md|AGENTS\.md|docs\/|\.codex\/)/.test(file),
);
const appCodeChanged = uniqueChangedFiles.some((file) => /^src\/.*\.(ts|tsx)$/.test(file));
const validationFilesChanged = uniqueChangedFiles.some((file) =>
  /^(package(-lock)?\.json|vitest\.config\.ts|tsconfig\.json|eslint\.config\.mjs|next\.config\.mjs|scripts\/|\.githooks\/)/.test(
    file,
  ),
);

console.log("Running pre-commit workflow checks...");

run("git", checkAllChanges ? ["diff", "--check"] : ["diff", "--cached", "--check"]);

if (checkAllChanges) {
  assertUntrackedTextHasNoWhitespaceErrors(uniqueChangedFiles);
}

run("npm", ["run", "lint"]);

if (appCodeChanged || validationFilesChanged) {
  run("npm", ["run", "test:coverage"]);
  run("npm", ["run", "typecheck"]);
  run("npm", ["run", "build"]);
} else if (docsChanged) {
  console.log("Docs-only change detected; lint and whitespace checks are sufficient.");
}

console.log("Pre-commit workflow checks passed.");

function readTextIfSmall(file) {
  if (!existsSync(file)) {
    return "";
  }

  const stats = statSync(file);

  if (!stats.isFile() || stats.size > 1024 * 1024) {
    return "";
  }

  return readFileSync(file, "utf8");
}

function assertUntrackedTextHasNoWhitespaceErrors(files) {
  const untrackedFiles = files.filter(
    (file) => !run("git", ["ls-files", "--error-unmatch", file], { capture: true, allowFailure: true }),
  );
  const failures = [];

  for (const file of untrackedFiles) {
    const text = readTextIfSmall(file);

    if (!text) {
      continue;
    }

    const lines = text.split("\n");

    lines.forEach((line, index) => {
      if (/[ \t]+$/.test(line)) {
        failures.push(`${file}:${index + 1}: trailing whitespace`);
      }
    });

    if (!text.endsWith("\n")) {
      failures.push(`${file}:${lines.length}: missing newline at end of file`);
    }
  }

  if (failures.length > 0) {
    console.error(failures.join("\n"));
    fail("untracked files contain whitespace errors");
  }
}
