import type { SearchSort } from "@/features/search/services/sort-options";

export interface SearchProviderCapabilities {
  suggestions: boolean;
  facets: boolean;
  sorting: readonly SearchSort[];
  pagination: boolean;
  analytics: boolean;
}

export interface GenerativeProviderCapabilities {
  available: boolean;
  streaming: boolean;
  citations: boolean;
  feedbackPersistence: boolean;
}

export const inMemorySearchCapabilities: SearchProviderCapabilities = Object.freeze({
  analytics: true,
  facets: true,
  pagination: true,
  sorting: Object.freeze(["relevance", "newest", "most-popular"] as const),
  suggestions: true,
});

export const coveoHeadlessCapabilities: SearchProviderCapabilities = Object.freeze({
  analytics: true,
  facets: true,
  pagination: true,
  sorting: Object.freeze(["relevance"] as const),
  suggestions: true,
});

export const mockGenerativeCapabilities: GenerativeProviderCapabilities = Object.freeze({
  available: true,
  citations: true,
  feedbackPersistence: false,
  streaming: true,
});

export const coveoGenerativeCapabilities: GenerativeProviderCapabilities = Object.freeze({
  available: false,
  citations: false,
  feedbackPersistence: false,
  streaming: false,
});

export function supportsSort(
  capabilities: SearchProviderCapabilities,
  sort: string,
): sort is SearchSort {
  return capabilities.sorting.includes(sort as SearchSort);
}
