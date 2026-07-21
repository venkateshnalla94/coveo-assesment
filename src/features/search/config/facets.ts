export const SEARCH_FACET_CONFIG: Record<string, { label: string; order: number }> = {
  filetype: { label: "Content Type", order: 10 },
  source: { label: "Source", order: 20 },
  product: { label: "Product", order: 30 },
};

export function getFacetLabel(field: string, fallbackLabel?: string) {
  return (
    SEARCH_FACET_CONFIG[field]?.label ??
    fallbackLabel ??
    field
      .replace(/^@/, "")
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase())
  );
}

export function getFacetOrder(field: string) {
  return SEARCH_FACET_CONFIG[field]?.order ?? 100;
}
