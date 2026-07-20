import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: [
        "src/app/api/search-token/route.ts",
        "src/lib/coveo/search-token.ts",
        "src/components/search/results/result-fields.ts",
      ],
      provider: "v8",
      reporter: ["text", "json-summary"],
      thresholds: {
        perFile: true,
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
    environment: "node",
    globals: false,
    restoreMocks: true,
  },
});
