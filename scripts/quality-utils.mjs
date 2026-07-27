import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";

export function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
  });

  if (result.status !== 0 && !options.allowFailure) {
    process.exit(result.status ?? 1);
  }

  return {
    status: result.status ?? 0,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

export function commandOutput(command, args, options = {}) {
  return run(command, args, { ...options, capture: true }).stdout.trim();
}

export function gitFiles(args) {
  return commandOutput("git", args, { allowFailure: true })
    .split("\n")
    .map((file) => file.trim())
    .filter(Boolean);
}

export function unique(values) {
  return [...new Set(values)];
}

export function readTextIfSmall(file) {
  if (!existsSync(file)) {
    return "";
  }

  const stats = statSync(file);

  if (!stats.isFile() || stats.size > 1024 * 1024) {
    return "";
  }

  const buffer = readFileSync(file);

  // Skip binary files (e.g. PNGs) — a null byte anywhere in the content is
  // git's own heuristic for "not text" and whitespace checks don't apply.
  if (buffer.includes(0)) {
    return "";
  }

  return buffer.toString("utf8");
}

export function fail(message, prefix = "check failed") {
  console.error(`\n${prefix}: ${message}`);
  process.exit(1);
}

export function stagedFiles() {
  return gitFiles(["diff", "--cached", "--name-only", "--diff-filter=ACMR"]);
}

export function changedFilesFromHead() {
  const changed = gitFiles(["diff", "--name-only", "--diff-filter=ACMR", "HEAD", "--"]);
  const untracked = gitFiles(["ls-files", "--others", "--exclude-standard"]);
  return unique([...changed, ...untracked]);
}

export function changedFilesFromBase(base) {
  if (!base) {
    return changedFilesFromHead();
  }

  const changed = gitFiles(["diff", "--name-only", "--diff-filter=ACMR", `${base}...HEAD`, "--"]);
  return unique(changed);
}

export function trackedFiles() {
  return gitFiles(["ls-files"]);
}

export function untrackedFiles() {
  return gitFiles(["ls-files", "--others", "--exclude-standard"]);
}

export function allWorkingTreeFiles() {
  return unique([...trackedFiles(), ...untrackedFiles()]);
}

export function lintable(files) {
  return files.filter((file) => /\.(js|jsx|mjs|cjs|ts|tsx)$/.test(file) && existsSync(file));
}

export function assertForbiddenPaths(files, prefix = "check failed") {
  const forbiddenPaths = [
    /^\.env($|\.)/,
    /^\.env\.local$/,
    /^\.env\.production$/,
    /^\.claude\//,
    /^\.next\//,
    /^node_modules\//,
    /^playwright-report\//,
    /^test-results\//,
    /^coverage\//,
    /^next-env\.d\.ts$/,
    /^tsconfig\.tsbuildinfo$/,
    /(^|\/)\.DS_Store$/,
  ];

  const allowed = new Set([".env.example"]);
  const forbiddenFile = files.find(
    (file) => !allowed.has(file) && forbiddenPaths.some((pattern) => pattern.test(file)),
  );

  if (forbiddenFile) {
    fail(`refusing local, generated, or secret-bearing path: ${forbiddenFile}`, prefix);
  }
}

export function assertTextFormatting(files, prefix = "format check failed") {
  const failures = [];

  for (const file of files) {
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
    fail("text files contain whitespace errors", prefix);
  }
}
