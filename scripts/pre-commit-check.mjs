import { assertForbiddenPaths, lintable, run, stagedFiles } from "./quality-utils.mjs";

const files = stagedFiles();

if (files.length === 0) {
  process.exit(0);
}

console.log("Running staged pre-commit checks...");

assertForbiddenPaths(files, "pre-commit failed");
run("node", ["scripts/format-check.mjs", "--staged"]);
run("node", ["scripts/secret-scan.mjs", "--staged"]);

const lintTargets = lintable(files);

if (lintTargets.length > 0) {
  run("npx", ["eslint", "--no-warn-ignored", ...lintTargets]);
} else {
  console.log("No staged JavaScript or TypeScript files to lint.");
}

console.log("Pre-commit checks passed.");
