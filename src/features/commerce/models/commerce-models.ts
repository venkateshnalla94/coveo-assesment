import type { SearchSuggestion } from "@/features/search/models/search-models";

export type ProductFacetSelection =
  | {
      field: string;
      type: "regular" | "hierarchical";
      values: string[];
    }
  | {
      field: string;
      type: "numericalRange";
      start: number;
      end: number;
    };

export interface ProductSearchRequest {
  query: string;
  page: number;
  perPage: number;
  facets: ProductFacetSelection[];
}

export interface ProductResult {
  id: string;
  title: string;
  description: string;
  fullDescription?: string;
  url?: string;
  imageUrl?: string;
  images: string[];
  brand?: string;
  categories: string[];
  price?: number;
  promoPrice?: number;
  rating?: number;
  inStock?: boolean;
  itemGroupId?: string;
  compatibleRobotSeries: string[];
  compatibleRobots: string[];
  compatibleJoints: string[];
  compatiblePartsSkus: string[];
  excerpt?: string;
  providerMetadata?: {
    permanentId?: string;
    rawResultType?: string;
  };
}

export interface ProductPagination {
  page: number;
  perPage: number;
  totalEntries: number;
  totalPages: number;
  totalProducts: number;
}

export interface ProductFacetValue {
  value: string;
  label: string;
  count: number;
  selected: boolean;
}

export interface ProductHierarchicalFacetValue extends ProductFacetValue {
  path: string[];
  isLeafValue: boolean;
}

export interface ProductRangeFacetValue {
  start: number;
  end: number;
  endInclusive: boolean;
  count: number;
  selected: boolean;
}

export interface ProductFacetBase {
  id: string;
  field: string;
  label: string;
}

export interface ProductRegularFacet extends ProductFacetBase {
  type: "regular";
  values: ProductFacetValue[];
}

export interface ProductHierarchicalFacet extends ProductFacetBase {
  type: "hierarchical";
  delimitingCharacter?: string;
  values: ProductHierarchicalFacetValue[];
}

export interface ProductNumericalRangeFacet extends ProductFacetBase {
  type: "numericalRange";
  domain?: {
    min: number;
    max: number;
    increment: number;
  };
  values: ProductRangeFacetValue[];
}

export type ProductFacet =
  | ProductRegularFacet
  | ProductHierarchicalFacet
  | ProductNumericalRangeFacet;

export interface ProductDidYouMean {
  originalQuery: string;
  correctedTo: string;
  wasAutomaticallyCorrected: boolean;
}

export interface ProductSearchResponse {
  products: ProductResult[];
  facets: ProductFacet[];
  pagination: ProductPagination;
  totalCount: number;
  didYouMean?: ProductDidYouMean;
  availableSorts: string[];
  appliedSort: string;
}

export interface CommerceProductProvider {
  search(request: ProductSearchRequest, options?: { signal?: AbortSignal }): Promise<ProductSearchResponse>;
  getSuggestions?(query: string, options?: { signal?: AbortSignal }): Promise<SearchSuggestion[]>;
}
