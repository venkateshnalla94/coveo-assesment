import { readFileSync } from "node:fs";
import { fail } from "./quality-utils.mjs";

const messagePath = process.argv[2];

if (!messagePath) {
  fail("missing commit message file path", "commit-msg failed");
}

const message = readFileSync(messagePath, "utf8").trim();
const firstLine = message.split("\n")[0]?.trim() ?? "";

// Merge commits (git merge / a non-fast-forward git pull) carry an auto-generated "Merge ..."
// subject that can't follow Conventional Commits. Exempt them so integrating a diverged branch
// isn't blocked; the same applies to git revert's "Revert ..." subject.
if (/^(Merge|Revert) /.test(firstLine)) {
  console.log("Commit message check passed (merge/revert commit).");
  process.exit(0);
}

const validTypes = ["feat", "fix", "docs", "test", "refactor", "perf", "build", "ci", "chore", "revert"];
const pattern = new RegExp(`^(${validTypes.join("|")})(\\([a-z0-9][a-z0-9-]*\\))?: .+`);

if (!pattern.test(firstLine)) {
  console.error("Commit message must use Conventional Commits.");
  console.error("");
  console.error("Expected:");
  console.error("  type(optional-scope): non-empty subject");
  console.error("");
  console.error(`Supported types: ${validTypes.join(", ")}`);
  console.error("");
  console.error("Examples:");
  console.error("  feat(search): add Coveo facet adapter");
  console.error("  fix(generative): guard invalid citation links");
  console.error("  ci(review): add pull-request quality gate");
  fail(`invalid commit message: ${firstLine || "<empty>"}`, "commit-msg failed");
}

console.log("Commit message check passed.");
