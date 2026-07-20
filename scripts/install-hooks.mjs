import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

if (!existsSync(".git")) {
  process.exit(0);
}

const result = spawnSync("git", ["config", "core.hooksPath", ".githooks"], {
  encoding: "utf8",
  stdio: "pipe",
});

if (result.status !== 0) {
  const detail = result.stderr.trim() || result.stdout.trim();
  console.warn(`Unable to install git hooks: ${detail}`);
  process.exit(0);
}

console.log("Git hooks installed from .githooks");
