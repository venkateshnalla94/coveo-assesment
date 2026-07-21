import type {
  CommerceProductProvider,
  ProductSearchRequest,
  ProductSearchResponse,
} from "@/features/commerce/models/commerce-models";
import type { SearchSuggestion } from "@/features/search/models/search-models";

export class CoveoCommerceProductProvider implements CommerceProductProvider {
  private readonly clientId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `commerce-client-${Date.now()}`;

  async search(request: ProductSearchRequest, options?: { signal?: AbortSignal }): Promise<ProductSearchResponse> {
    const response = await fetch("/api/coveo/commerce/search", {
      body: JSON.stringify({ ...request, clientId: this.clientId }),
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: options?.signal,
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(body?.error ?? "Commerce search could not be loaded.");
    }

    return (await response.json()) as ProductSearchResponse;
  }

  async getSuggestions(query: string, options?: { signal?: AbortSignal }): Promise<SearchSuggestion[]> {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return [];
    }

    const response = await fetch("/api/coveo/commerce/suggestions", {
      body: JSON.stringify({ query: normalizedQuery }),
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: options?.signal,
    });

    if (!response.ok) {
      return [];
    }

    const body = (await response.json().catch(() => null)) as { suggestions?: SearchSuggestion[] } | null;
    return body?.suggestions ?? [];
  }
}
