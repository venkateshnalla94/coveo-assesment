import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    coverage: {
      include: [
        "src/app/api/search-token/route.ts",
        "src/lib/coveo/search-token.ts",
        "src/components/search/SearchExperience.tsx",
        "src/components/search/results/result-fields.ts",
        "src/components/shared/ConfigurationNotice.tsx",
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
    environment: "jsdom",
    globals: false,
    restoreMocks: true,
  },
});
