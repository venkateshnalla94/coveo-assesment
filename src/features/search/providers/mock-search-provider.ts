import type { SearchQuery, SearchResponse, SearchSuggestion } from "@/features/search/models/search-models";
import { inMemorySearchCapabilities } from "@/features/search/capabilities/provider-capabilities";
import { mapCoveoSearchResponse } from "@/features/search/providers/coveo-response-mapper";
import { InMemorySearchProvider } from "@/features/search/providers/in-memory-search-provider";
import type { SearchProvider } from "@/features/search/providers/search-provider";

export class MockSearchProvider implements SearchProvider {
  readonly capabilities = inMemorySearchCapabilities;
  private readonly provider: InMemorySearchProvider;

  constructor(rawResponse: unknown) {
    this.provider = new InMemorySearchProvider(mapCoveoSearchResponse(rawResponse));
  }

  async search(query: SearchQuery): Promise<SearchResponse> {
    return this.provider.search(query);
  }

  async getSuggestions(query: string): Promise<SearchSuggestion[]> {
    return this.provider.getSuggestions(query);
  }
}
