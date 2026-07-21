import type {
  SearchQuery,
  SearchResponse,
  SearchSuggestion,
} from "@/features/search/models/search-models";
import { coveoHeadlessCapabilities } from "@/features/search/capabilities/provider-capabilities";
import type { SearchProvider } from "@/features/search/providers/search-provider";

export class CoveoSearchProvider implements SearchProvider {
  readonly capabilities = coveoHeadlessCapabilities;

  async search(query: SearchQuery): Promise<SearchResponse> {
    void query;

    throw new Error(
      "CoveoSearchProvider is a Phase 2 skeleton. Use the existing Headless controller path until a server-safe provider adapter is implemented.",
    );
  }

  async getSuggestions(query: string): Promise<SearchSuggestion[]> {
    void query;

    return [];
  }
}
