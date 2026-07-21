import type { SearchQuery } from "@/features/search/models/search-models";

export const DEFAULT_SEARCH_QUERY: SearchQuery = {
  filters: {},
  page: 1,
  pageSize: 4,
  query: "digital transformation",
  sort: "relevance",
};

export function normalizeSearchQuery(query: SearchQuery): SearchQuery {
  return {
    filters: Object.fromEntries(
      Object.entries(query.filters)
        .map(([field, values]) => [field, values.filter((value) => value.trim().length > 0)])
        .filter(([, values]) => values.length > 0),
    ),
    page: Number.isInteger(query.page) && query.page > 0 ? query.page : 1,
    pageSize: Number.isInteger(query.pageSize) && query.pageSize > 0 ? query.pageSize : 4,
    query: query.query.trim(),
    sort: query.sort || "relevance",
  };
}

export function setSearchQueryText(currentQuery: SearchQuery, query: string): SearchQuery {
  return normalizeSearchQuery({
    ...currentQuery,
    page: 1,
    query,
  });
}

export function setSearchQuerySort(currentQuery: SearchQuery, sort: string): SearchQuery {
  return normalizeSearchQuery({
    ...currentQuery,
    page: 1,
    sort,
  });
}

export function setSearchQueryPage(currentQuery: SearchQuery, page: number): SearchQuery {
  return normalizeSearchQuery({
    ...currentQuery,
    page,
  });
}

export function toggleSearchQueryFacet(
  currentQuery: SearchQuery,
  field: string,
  value: string,
): SearchQuery {
  const selectedValues = currentQuery.filters[field] ?? [];
  const nextValues = selectedValues.includes(value)
    ? selectedValues.filter((selectedValue) => selectedValue !== value)
    : [...selectedValues, value];

  return normalizeSearchQuery({
    ...currentQuery,
    filters: {
      ...currentQuery.filters,
      [field]: nextValues,
    },
    page: 1,
  });
}

export function clearSearchQueryFacet(currentQuery: SearchQuery, field: string): SearchQuery {
  const remainingFilters = Object.fromEntries(
    Object.entries(currentQuery.filters).filter(([filterField]) => filterField !== field),
  );

  return normalizeSearchQuery({
    ...currentQuery,
    filters: remainingFilters,
    page: 1,
  });
}

export function clearSearchQueryFilters(currentQuery: SearchQuery): SearchQuery {
  return normalizeSearchQuery({
    ...currentQuery,
    filters: {},
    page: 1,
  });
}
