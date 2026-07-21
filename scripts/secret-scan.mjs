import {
  assertForbiddenPaths,
  allWorkingTreeFiles,
  changedFilesFromHead,
  commandOutput,
  fail,
  readTextIfSmall,
  stagedFiles,
} from "./quality-utils.mjs";

const mode = process.argv.includes("--staged") ? "staged" : process.argv.includes("--changed") ? "changed" : "all";
const files = mode === "staged" ? stagedFiles() : mode === "changed" ? changedFilesFromHead() : allWorkingTreeFiles();

assertForbiddenPaths(files, "secret scan failed");

const allowedPlaceholderFiles = new Set([".env.example"]);
const patterns = [
  {
    name: "Coveo access token",
    pattern: /\bCOVEO_ACCESS_TOKEN[ \t]*=[ \t]*(?!["']?(?:$|changeme|replace-me|your-|example|placeholder|test|mock|fake|dummy|local|dev))["']?[^\s#]+/i,
  },
  {
    name: "Coveo platform API key",
    pattern: /\bCOVEO_PLATFORM_API_KEY[ \t]*=[ \t]*(?!["']?(?:$|changeme|replace-me|your-|example|placeholder|test|mock|fake|dummy|local|dev))["']?[^\s#]+/i,
  },
  {
    name: "Authorization bearer token",
    pattern: /Authorization\s*:\s*Bearer\s+(?!\$\{|\{\{|\[)[A-Za-z0-9._~+/=-]{20,}/i,
  },
  {
    name: "private key block",
    pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  },
  {
    name: "high-confidence API key",
    pattern: /\b(?:api[_-]?key|apiKey|token|secret)\b[ \t]*[:=][ \t]*["']?[A-Za-z0-9._~+/=-]{32,}["']?/i,
  },
];

const stagedDiff = mode === "staged" ? commandOutput("git", ["diff", "--cached", "--unified=0", "--"], { allowFailure: true }) : "";
const failures = [];

for (const file of files) {
  if (allowedPlaceholderFiles.has(file)) {
    continue;
  }

  const text = readTextIfSmall(file);

  if (!text) {
    continue;
  }

  for (const { name, pattern } of patterns) {
    if (pattern.test(text)) {
      failures.push(`${file}: possible ${name}`);
    }
  }
}

if (mode === "staged") {
  for (const { name, pattern } of patterns) {
    if (pattern.test(stagedDiff)) {
      failures.push(`staged diff: possible ${name}`);
    }
  }
}

if (failures.length > 0) {
  console.error([...new Set(failures)].join("\n"));
  fail("remove the value, rotate it if it was real, and use .env.local or your secret manager instead", "secret scan failed");
}

console.log(`Secret scan passed for ${files.length} ${mode} file(s).`);
