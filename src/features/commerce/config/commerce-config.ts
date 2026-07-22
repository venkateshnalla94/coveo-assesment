export const COMMERCE_DEFAULTS = {
  country: "GB",
  currency: "GBP",
  language: "en",
  perPage: 24,
  trackingId: "robomotion",
  viewUrl: "https://robomotion.com/search",
};

export const COMMERCE_FACET_LABELS: Record<string, string> = {
  // Matches the "Compatible Robot Series" label used on product cards and the comparison
  // table, since compatible_with_robots is a distinct (non-facetable) field shown as
  // "Compatible Robots" elsewhere — keeping the two apart avoids implying they're the same data.
  compatible_robot_series: "Compatible Robot Series",
  ec_brand: "Brand",
  ec_category: "Category",
  ec_price: "Price",
  ec_rating: "Rating",
};

export const COMMERCE_FACET_ORDER: Record<string, number> = {
  ec_category: 10,
  compatible_robot_series: 20,
  ec_brand: 30,
  ec_price: 40,
  ec_rating: 50,
};

export function getCommerceFacetLabel(field: string, fallback?: string) {
  return COMMERCE_FACET_LABELS[field] ?? fallback ?? field.replace(/[_-]+/g, " ");
}

export function getCommerceFacetOrder(field: string) {
  return COMMERCE_FACET_ORDER[field] ?? 100;
}
