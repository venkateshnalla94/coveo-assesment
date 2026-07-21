import { run } from "./quality-utils.mjs";

console.log("Running pre-push validation...");
run("npm", ["run", "lint"]);
run("npm", ["run", "typecheck"]);
run("npm", ["run", "test"]);
run("npm", ["run", "test:coverage"]);
run("npm", ["run", "build"]);
run("node", ["scripts/secret-scan.mjs", "--changed"]);
console.log("Pre-push validation passed.");
console.log("Playwright E2E is not run by pre-push. Run `npm run test:e2e` before opening or updating a PR.");
