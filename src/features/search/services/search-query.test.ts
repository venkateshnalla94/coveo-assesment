import { describe, expect, it } from "vitest";

import {
  clearSearchQueryFacet,
  clearSearchQueryFilters,
  setSearchQueryPage,
  setSearchQuerySort,
  setSearchQueryText,
  toggleSearchQueryFacet,
} from "@/features/search/services/search-query";

const query = {
  filters: {},
  page: 3,
  pageSize: 4,
  query: "digital",
  sort: "relevance",
};

describe("search query helpers", () => {
  it("resets page after query, facet, and sort changes", () => {
    expect(setSearchQueryText(query, "AI search")).toMatchObject({ page: 1, query: "AI search" });
    expect(setSearchQuerySort(query, "newest")).toMatchObject({ page: 1, sort: "newest" });
    expect(toggleSearchQueryFacet(query, "source", "Docs")).toMatchObject({
      filters: { source: ["Docs"] },
      page: 1,
    });
  });

  it("clears one facet group or all filters", () => {
    const filteredQuery = {
      ...query,
      filters: { filetype: ["PDF"], source: ["Docs"] },
    };

    expect(clearSearchQueryFacet(filteredQuery, "filetype").filters).toEqual({ source: ["Docs"] });
    expect(clearSearchQueryFilters(filteredQuery).filters).toEqual({});
  });

  it("preserves requested page for pagination", () => {
    expect(setSearchQueryPage(query, 2).page).toBe(2);
  });

  it("normalizes invalid page values and deselects selected facets", () => {
    expect(setSearchQueryPage(query, -1).page).toBe(1);
    expect(toggleSearchQueryFacet({ ...query, filters: { source: ["Docs"] } }, "source", "Docs"))
      .toMatchObject({
        filters: {},
        page: 1,
      });
  });
});
