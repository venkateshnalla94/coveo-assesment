export interface CommerceCapabilities {
  comparison: boolean;
  details: boolean;
  facets: boolean;
  rangeFacets: boolean;
  sorting: readonly string[];
  suggestions: boolean;
}

export const commerceCapabilities: CommerceCapabilities = Object.freeze({
  comparison: true,
  details: true,
  facets: true,
  rangeFacets: true,
  sorting: Object.freeze(["relevance"] as const),
  suggestions: true,
});
