import type {
  SearchQuery,
  SearchResponse,
  SearchResult,
  SearchSuggestion,
} from "@/features/search/models/search-models";
import type { SearchProviderCapabilities } from "@/features/search/capabilities/provider-capabilities";

export interface SearchProvider {
  readonly capabilities: SearchProviderCapabilities;
  search(query: SearchQuery): Promise<SearchResponse>;
  getSuggestions(query: string): Promise<SearchSuggestion[]>;
  getTrendingContent?(): Promise<SearchResult[]>;
}
