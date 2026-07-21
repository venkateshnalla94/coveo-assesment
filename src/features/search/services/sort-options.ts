import type { SearchResult } from "@/features/search/models/search-models";

export const SEARCH_SORT_OPTIONS = [
  {
    label: "Relevance",
    value: "relevance",
  },
  {
    label: "Newest",
    value: "newest",
  },
  {
    label: "Most Popular",
    value: "most-popular",
  },
] as const;

export type SearchSort = (typeof SEARCH_SORT_OPTIONS)[number]["value"];

export function isSearchSort(value: string): value is SearchSort {
  return SEARCH_SORT_OPTIONS.some((option) => option.value === value);
}

export function normalizeSearchSort(value: string): SearchSort {
  return isSearchSort(value) ? value : "relevance";
}

export function sortSearchResults(results: SearchResult[], sort: string): SearchResult[] {
  const normalizedSort = normalizeSearchSort(sort);

  if (normalizedSort === "newest") {
    return [...results].sort((left, right) => {
      const leftTime = left.updatedAt ? new Date(left.updatedAt).getTime() : 0;
      const rightTime = right.updatedAt ? new Date(right.updatedAt).getTime() : 0;

      return rightTime - leftTime;
    });
  }

  if (normalizedSort === "most-popular") {
    return [...results].sort((left, right) => {
      const leftScore = typeof left.metadata?.popularity === "number" ? left.metadata.popularity : 0;
      const rightScore =
        typeof right.metadata?.popularity === "number" ? right.metadata.popularity : 0;

      return rightScore - leftScore || left.title.localeCompare(right.title);
    });
  }

  return results;
}
