export type SearchResponseFacetValue = {
  numberOfResults: number;
  state: "idle" | "selected";
  value: string;
};

export type SearchResponseFacet = {
  field: string;
  label: string;
  values: SearchResponseFacetValue[];
};

export type SearchResponseResult = {
  clickUri: string;
  date?: string;
  excerpt: string;
  filetype?: string;
  printableUri: string;
  source?: string;
  tags: string[];
  thumbnail?: string;
  title: string;
  uniqueId: string;
};

export type CoveoSearchResponse = {
  durationInSeconds: number;
  facets: SearchResponseFacet[];
  firstResult: number;
  lastResult: number;
  query: string;
  results: SearchResponseResult[];
  searchHub: string;
  totalCount: number;
};
