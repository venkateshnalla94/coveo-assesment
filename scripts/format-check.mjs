import { allWorkingTreeFiles, assertTextFormatting, changedFilesFromHead, run, stagedFiles } from "./quality-utils.mjs";

const mode = process.argv.includes("--staged") ? "staged" : process.argv.includes("--changed") ? "changed" : "all";
const files = mode === "staged" ? stagedFiles() : mode === "changed" ? changedFilesFromHead() : allWorkingTreeFiles();

if (files.length === 0) {
  process.exit(0);
}

if (mode === "staged") {
  run("git", ["diff", "--cached", "--check"]);
} else if (mode === "changed") {
  run("git", ["diff", "--check"]);
} else {
  run("git", ["diff", "--check"], { allowFailure: false });
}

assertTextFormatting(files);
console.log(`Format check passed for ${files.length} ${mode} file(s).`);
