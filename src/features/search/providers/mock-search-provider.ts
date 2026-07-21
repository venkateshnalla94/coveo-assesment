import type {
  SearchQuery,
  SearchResponse,
  SearchSuggestion,
} from "@/features/search/models/search-models";
import { mapCoveoSearchResponse } from "@/features/search/providers/coveo-response-mapper";
import type { SearchProvider } from "@/features/search/providers/search-provider";

export class MockSearchProvider implements SearchProvider {
  private readonly response: SearchResponse;

  constructor(rawResponse: unknown) {
    this.response = mapCoveoSearchResponse(rawResponse);
  }

  async search(query: SearchQuery): Promise<SearchResponse> {
    void query;

    return this.response;
  }

  async getSuggestions(query: string): Promise<SearchSuggestion[]> {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return [];
    }

    return this.response.results
      .filter((result) => result.title.toLowerCase().includes(normalizedQuery))
      .slice(0, 5)
      .map((result) => ({
        id: result.id,
        label: result.title,
        value: result.title,
      }));
  }
}
