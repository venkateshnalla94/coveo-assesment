import { describe, expect, it } from "vitest";

import type { SearchQuery } from "@/features/search/models/search-models";
import { MockSearchProvider } from "@/features/search/providers/mock-search-provider";

const query: SearchQuery = {
  filters: {},
  page: 1,
  pageSize: 4,
  query: "digital",
  sort: "relevance",
};

describe("MockSearchProvider", () => {
  it("returns mapped search responses from the configured mock data", async () => {
    const provider = new MockSearchProvider({
      results: [
        {
          clickUri: "https://example.test/guide",
          excerpt: "Guide excerpt",
          filetype: "pdf",
          title: "Digital Guide",
          uniqueId: "guide-1",
        },
      ],
      totalCount: 1,
    });

    await expect(provider.search(query)).resolves.toMatchObject({
      totalCount: 1,
      results: [
        {
          description: "Guide excerpt",
          id: "guide-1",
          title: "Digital Guide",
          type: "documentation",
          url: "https://example.test/guide",
        },
      ],
    });
  });

  it("returns title-based suggestions without exposing raw mock data", async () => {
    const provider = new MockSearchProvider({
      results: [
        { title: "Digital Strategy", uniqueId: "strategy-1" },
        { title: "Search Relevance", uniqueId: "relevance-1" },
      ],
    });

    await expect(provider.getSuggestions("digital")).resolves.toEqual([
      {
        id: "strategy-1",
        label: "Digital Strategy",
        value: "Digital Strategy",
      },
    ]);
  });

  it("returns an empty suggestion list for blank queries", async () => {
    const provider = new MockSearchProvider({ results: [{ title: "Digital Strategy" }] });

    await expect(provider.getSuggestions("  ")).resolves.toEqual([]);
  });
});
