import type {
  FacetValue,
  SearchQuery,
  SearchResponse,
  SearchResult,
  SearchSuggestion,
} from "@/features/search/models/search-models";
import type { SearchProvider } from "@/features/search/providers/search-provider";
import { inMemorySearchCapabilities } from "@/features/search/capabilities/provider-capabilities";
import { getPaginationState } from "@/features/search/services/pagination";
import { normalizeSearchQuery } from "@/features/search/services/search-query";
import { sortSearchResults } from "@/features/search/services/sort-options";

export class InMemorySearchProvider implements SearchProvider {
  readonly capabilities = inMemorySearchCapabilities;

  constructor(
    private readonly response: SearchResponse,
    private readonly options: { suggestedQueries?: string[] } = {},
  ) {}

  async search(query: SearchQuery, options?: { signal?: AbortSignal }): Promise<SearchResponse> {
    throwIfAborted(options?.signal);
    const normalizedQuery = normalizeSearchQuery(query);
    const filteredResults = this.response.results.filter((result) =>
      resultMatchesSearchQuery(result, normalizedQuery),
    );
    const sortedResults = sortSearchResults(filteredResults, normalizedQuery.sort);
    const pagination = getPaginationState({
      page: normalizedQuery.page,
      pageSize: normalizedQuery.pageSize,
      totalCount: sortedResults.length,
    });
    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;

    return {
      ...this.response,
      facets: this.response.facets.map((facet) => ({
        ...facet,
        values: facet.values.map((value) =>
          withSelectedFacetValue(value, normalizedQuery.filters[facet.field] ?? []),
        ),
      })),
      query: normalizedQuery.query,
      results: sortedResults.slice(startIndex, startIndex + pagination.pageSize),
      totalCount: sortedResults.length,
    };
  }

  async getSuggestions(query: string, options?: { signal?: AbortSignal }): Promise<SearchSuggestion[]> {
    throwIfAborted(options?.signal);
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return [];
    }

    const configuredSuggestions = this.options.suggestedQueries ?? [];
    const profileSuggestions = configuredSuggestions
      .filter((suggestion) => suggestion.toLowerCase().includes(normalizedQuery))
      .map((suggestion) => ({
        id: `suggestion-${suggestion.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        label: suggestion,
        value: suggestion,
      }));

    const resultSuggestions = this.response.results
      .filter((result) => result.title.toLowerCase().includes(normalizedQuery))
      .slice(0, 5)
      .map((result) => ({
        id: result.id,
        label: result.title,
        value: result.title,
      }));

    return [...profileSuggestions, ...resultSuggestions].slice(0, 5);
  }
}

function throwIfAborted(signal: AbortSignal | undefined) {
  if (signal?.aborted) {
    throw new DOMException("The request was aborted.", "AbortError");
  }
}

function withSelectedFacetValue(value: FacetValue, selectedValues: string[]): FacetValue {
  return {
    ...value,
    selected:
      isAllFacetValue(value.value) || isAllFacetValue(value.label)
        ? selectedValues.length === 0
        : selectedValues.includes(value.value),
  };
}

function resultMatchesSearchQuery(result: SearchResult, query: SearchQuery) {
  return resultMatchesText(result, query.query) && resultMatchesFilters(result, query.filters);
}

function resultMatchesText(result: SearchResult, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return [result.title, result.description, result.source, result.displayUrl, ...(result.badges ?? [])]
    .filter((value): value is string => Boolean(value))
    .some((value) => value.toLowerCase().includes(normalizedQuery));
}

function resultMatchesFilters(result: SearchResult, filters: SearchQuery["filters"]) {
  return Object.entries(filters).every(([field, selectedValues]) => {
    if (selectedValues.length === 0) {
      return true;
    }

    return selectedValues.some((selectedValue) => resultMatchesFacetValue(result, field, selectedValue));
  });
}

function resultMatchesFacetValue(result: SearchResult, field: string, selectedValue: string) {
  const normalizedSelectedValue = selectedValue.toLowerCase();

  if (field === "filetype") {
    const filetype = typeof result.metadata?.filetype === "string" ? result.metadata.filetype : "";
    const contentTypeLabels: Record<string, string> = {
      doc: "word",
      docx: "word",
      html: "web page",
      pdf: "pdf",
      ppt: "powerpoint",
      pptx: "powerpoint",
      web: "web page",
      xls: "excel",
      xlsx: "excel",
    };

    return (
      filetype.toLowerCase() === normalizedSelectedValue ||
      contentTypeLabels[filetype.toLowerCase()] === normalizedSelectedValue
    );
  }

  if (field === "source") {
    return result.source?.toLowerCase() === normalizedSelectedValue;
  }

  const metadataValue = result.metadata?.[field];

  return typeof metadataValue === "string" && metadataValue.toLowerCase() === normalizedSelectedValue;
}

function isAllFacetValue(value: string) {
  return value.toLowerCase() === "all" || value.toLowerCase() === "any time";
}
