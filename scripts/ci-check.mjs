import { run } from "./quality-utils.mjs";

run("npm", ["run", "format:check"]);
run("npm", ["run", "lint"]);
run("npm", ["run", "typecheck"]);
run("npm", ["run", "test:coverage"]);
run("npm", ["run", "build"]);
run("node", ["scripts/secret-scan.mjs", "--all"]);
