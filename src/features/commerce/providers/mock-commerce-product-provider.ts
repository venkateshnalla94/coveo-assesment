import { mapCommerceSearchResponse } from "@/features/commerce/mappers/commerce-response-mapper";
import type {
  CommerceProductProvider,
  ProductSearchRequest,
  ProductSearchResponse,
} from "@/features/commerce/models/commerce-models";
import type { SearchSuggestion } from "@/features/search/models/search-models";
import {
  buildMockCommerceResponse,
  commerceSuggestedQueries,
} from "@/features/commerce/fixtures/commerce-fixtures";

export class MockCommerceProductProvider implements CommerceProductProvider {
  async search(request: ProductSearchRequest, options?: { signal?: AbortSignal }): Promise<ProductSearchResponse> {
    throwIfAborted(options?.signal);
    return mapCommerceSearchResponse(buildMockCommerceResponse(request), request.facets);
  }

  async getSuggestions(query: string, options?: { signal?: AbortSignal }): Promise<SearchSuggestion[]> {
    throwIfAborted(options?.signal);
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return [];
    }

    return commerceSuggestedQueries
      .filter((suggestion) => suggestion.toLowerCase().includes(normalizedQuery))
      .map((suggestion) => ({
        id: `commerce-suggestion-${suggestion.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`,
        label: suggestion,
        value: suggestion,
      }))
      .slice(0, 5);
  }
}

function throwIfAborted(signal: AbortSignal | undefined) {
  if (signal?.aborted) {
    throw new DOMException("The request was aborted.", "AbortError");
  }
}
