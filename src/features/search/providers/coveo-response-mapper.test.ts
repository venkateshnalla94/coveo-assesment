import { describe, expect, it } from "vitest";

import { mapCoveoSearchResponse } from "@/features/search/providers/coveo-response-mapper";

describe("mapCoveoSearchResponse", () => {
  it("maps raw Coveo-shaped response data to the search domain model", () => {
    const response = mapCoveoSearchResponse({
      durationInSeconds: 0.12,
      facets: [
        {
          field: "filetype",
          label: "Content Type",
          values: [{ numberOfResults: 3, state: "selected", value: "PDF" }],
        },
      ],
      query: "digital transformation",
      results: [
        {
          clickUri: "https://example.test/guide",
          date: "2026-07-18T10:00:00Z",
          excerpt: "A useful guide.",
          filetype: "pdf",
          printableUri: "example.test / guide",
          source: "Knowledge Base",
          tags: ["Guide"],
          thumbnail: "https://example.test/thumb.png",
          title: "Guide",
          uniqueId: "guide-1",
        },
      ],
      searchHub: "assessment-search",
      totalCount: 10,
    });

    expect(response).toMatchObject({
      durationMs: 120,
      query: "digital transformation",
      searchHub: "assessment-search",
      totalCount: 10,
      facets: [
        {
          field: "filetype",
          id: "mock-facet-filetype",
          label: "Content Type",
          values: [{ count: 3, label: "PDF", selected: true, value: "PDF" }],
        },
      ],
      results: [
        {
          badges: ["Guide"],
          description: "A useful guide.",
          displayUrl: "example.test / guide",
          id: "guide-1",
          imageUrl: "https://example.test/thumb.png",
          metadata: { filetype: "pdf" },
          source: "Knowledge Base",
          title: "Guide",
          type: "documentation",
          updatedAt: "2026-07-18T10:00:00Z",
          url: "https://example.test/guide",
        },
      ],
    });
  });

  it("uses stable defaults when optional result fields are missing", () => {
    const response = mapCoveoSearchResponse({
      results: [{ title: "Minimal result", uniqueId: "minimal-1" }],
    });

    expect(response.results[0]).toEqual({
      description: "",
      id: "minimal-1",
      metadata: { filetype: null },
      title: "Minimal result",
      type: "article",
      url: "#",
    });
    expect(response.totalCount).toBe(1);
  });

  it("does not throw on malformed provider data", () => {
    const response = mapCoveoSearchResponse({
      durationInSeconds: "fast",
      facets: [{ field: "source", values: [{ numberOfResults: "many" }, null] }, null],
      results: [null, { clickUri: 42, tags: ["Valid", 10], title: "" }],
      totalCount: "unknown",
    });

    expect(response.totalCount).toBe(2);
    expect(response.facets).toEqual([
      {
        field: "source",
        id: "mock-facet-source",
        label: "source",
        values: [],
      },
    ]);
    expect(response.results).toEqual([
      {
        description: "",
        id: "mock-result-1",
        metadata: { filetype: null },
        title: "Untitled result",
        type: "article",
        url: "#",
      },
      {
        badges: ["Valid"],
        description: "",
        id: "mock-result-2",
        metadata: { filetype: null },
        title: "Untitled result",
        type: "article",
        url: "#",
      },
    ]);
  });
});
