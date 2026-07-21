import type {
  SearchQuery,
  SearchResponse,
  SearchResult,
  SearchSuggestion,
} from "@/features/search/models/search-models";

export interface SearchProvider {
  search(query: SearchQuery): Promise<SearchResponse>;
  getSuggestions(query: string): Promise<SearchSuggestion[]>;
  getTrendingContent?(): Promise<SearchResult[]>;
}
