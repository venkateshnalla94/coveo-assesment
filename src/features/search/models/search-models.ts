export type SearchResultType = "article" | "documentation" | "video" | "community" | "product";

export type SearchMetadataValue = string | number | boolean | null;

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  url: string;
  type: SearchResultType;
  author?: string;
  badges?: string[];
  displayUrl?: string;
  imageUrl?: string;
  metadata?: Record<string, SearchMetadataValue>;
  source?: string;
  updatedAt?: string;
}

export interface FacetValue {
  value: string;
  label: string;
  count: number;
  selected: boolean;
}

export interface SearchFacet {
  id: string;
  field: string;
  label: string;
  values: FacetValue[];
}

export interface SearchQuery {
  query: string;
  page: number;
  pageSize: number;
  sort: string;
  filters: Record<string, string[]>;
}

export interface SearchResponse {
  results: SearchResult[];
  facets: SearchFacet[];
  totalCount: number;
  durationMs?: number;
  query?: string;
  queryCorrection?: string;
  searchHub?: string;
}

export interface SearchSuggestion {
  id: string;
  label: string;
  value: string;
}
