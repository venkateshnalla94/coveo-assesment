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
        "src/components/search/SearchBox.tsx",
        "src/components/search/SearchSuggestions.tsx",
        "src/components/search/Pagination.tsx",
        "src/components/search/SortControl.tsx",
        "src/components/search/facets/DomainFacetPanel.tsx",
        "src/components/search/results/DomainResultCard.tsx",
        "src/components/search/results/ResultList.tsx",
        "src/components/search/results/SearchResults.tsx",
        "src/components/search/results/SearchStatus.tsx",
        "src/components/search/results/ZeroResults.tsx",
        "src/components/search/results/result-fields.ts",
        "src/components/shared/ConfigurationNotice.tsx",
        "src/features/search/config/facets.ts",
        "src/features/search/models/search-state.ts",
        "src/features/search/providers/in-memory-search-provider.ts",
        "src/features/search/services/pagination.ts",
        "src/features/search/services/result-templates.ts",
        "src/features/search/services/search-query.ts",
        "src/features/search/services/sort-options.ts",
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
