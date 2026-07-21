import { describe, expect, it } from "vitest";

import type { SearchResponse } from "@/features/search/models/search-models";
import { InMemorySearchProvider } from "@/features/search/providers/in-memory-search-provider";

const response: SearchResponse = {
  facets: [
    {
      field: "filetype",
      id: "content-type",
      label: "Content Type",
      values: [
        { count: 2, label: "All", selected: true, value: "All" },
        { count: 1, label: "PDF", selected: false, value: "PDF" },
      ],
    },
  ],
  query: "digital",
  results: [
    {
      description: "Digital guide",
      id: "guide",
      metadata: { filetype: "pdf", popularity: 5 },
      title: "Digital Guide",
      type: "documentation",
      updatedAt: "2024-01-01T00:00:00Z",
      url: "https://example.test/guide",
    },
    {
      description: "Search page",
      id: "page",
      metadata: { filetype: "html", popularity: 10 },
      title: "Search Page",
      type: "article",
      updatedAt: "2026-01-01T00:00:00Z",
      url: "https://example.test/page",
    },
  ],
  totalCount: 2,
};

describe("InMemorySearchProvider", () => {
  it("filters, selects facets, sorts, and paginates domain results", async () => {
    const provider = new InMemorySearchProvider(response);

    await expect(
      provider.search({
        filters: { filetype: ["PDF"] },
        page: 1,
        pageSize: 1,
        query: "digital",
        sort: "newest",
      }),
    ).resolves.toMatchObject({
      facets: [
        {
          values: [
            { selected: false, value: "All" },
            { selected: true, value: "PDF" },
          ],
        },
      ],
      results: [{ id: "guide" }],
      totalCount: 1,
    });
  });

  it("returns suggestions from domain titles", async () => {
    const provider = new InMemorySearchProvider(response);

    await expect(provider.getSuggestions("dig")).resolves.toEqual([
      { id: "guide", label: "Digital Guide", value: "Digital Guide" },
    ]);
  });

  it("returns configured profile suggestions before domain-title suggestions", async () => {
    const provider = new InMemorySearchProvider(response, {
      suggestedQueries: ["authentication", "digital transformation"],
    });

    await expect(provider.getSuggestions("auth")).resolves.toEqual([
      { id: "suggestion-authentication", label: "authentication", value: "authentication" },
    ]);
  });

  it("matches source and metadata facets and rejects empty suggestions", async () => {
    const provider = new InMemorySearchProvider(response);

    await expect(
      provider.search({
        filters: { source: ["Docs"], topic: ["Search"] },
        page: 1,
        pageSize: 4,
        query: "",
        sort: "relevance",
      }),
    ).resolves.toMatchObject({ results: [], totalCount: 0 });
    await expect(provider.getSuggestions(" ")).resolves.toEqual([]);
  });

  it("rejects aborted provider requests before work starts", async () => {
    const provider = new InMemorySearchProvider(response);
    const controller = new AbortController();
    controller.abort();

    await expect(
      provider.search(
        {
          filters: {},
          page: 1,
          pageSize: 4,
          query: "digital",
          sort: "relevance",
        },
        { signal: controller.signal },
      ),
    ).rejects.toThrow("aborted");
    await expect(provider.getSuggestions("dig", { signal: controller.signal })).rejects.toThrow("aborted");
  });
});
