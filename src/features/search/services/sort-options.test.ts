import { describe, expect, it } from "vitest";

import type { SearchResult } from "@/features/search/models/search-models";
import { normalizeSearchSort, sortSearchResults } from "@/features/search/services/sort-options";

const results: SearchResult[] = [
  {
    description: "",
    id: "old",
    metadata: { popularity: 1 },
    title: "Old",
    type: "article",
    updatedAt: "2024-01-01T00:00:00Z",
    url: "https://example.test/old",
  },
  {
    description: "",
    id: "new",
    metadata: { popularity: 10 },
    title: "New",
    type: "article",
    updatedAt: "2026-01-01T00:00:00Z",
    url: "https://example.test/new",
  },
];

describe("sort options", () => {
  it("normalizes unknown sorts to relevance", () => {
    expect(normalizeSearchSort("unsupported")).toBe("relevance");
  });

  it("sorts by newest and deterministic popularity", () => {
    expect(sortSearchResults(results, "newest").map((result) => result.id)).toEqual(["new", "old"]);
    expect(sortSearchResults(results, "most-popular").map((result) => result.id)).toEqual([
      "new",
      "old",
    ]);
  });

  it("keeps relevance order and handles missing popularity metadata deterministically", () => {
    const unsorted = [
      { ...results[0], metadata: {} },
      { ...results[1], metadata: {} },
    ];

    expect(sortSearchResults(results, "relevance")).toBe(results);
    expect(sortSearchResults(unsorted, "most-popular").map((result) => result.title)).toEqual([
      "New",
      "Old",
    ]);
  });
});
