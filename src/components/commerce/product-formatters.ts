import type { ProductResult } from "@/features/commerce/models/commerce-models";

export function formatPrice(value: number | undefined) {
  if (value === undefined) {
    return "Price unavailable";
  }

  return new Intl.NumberFormat("en-GB", {
    currency: "GBP",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    style: "currency",
  }).format(value);
}

export function formatRating(value: number | undefined) {
  return value === undefined ? "No rating" : value.toFixed(1);
}

export function getLeafCategory(product: Pick<ProductResult, "categories">) {
  const category = product.categories.at(-1) ?? product.categories[0];

  if (!category) {
    return undefined;
  }

  return category.split("|").at(-1) ?? category;
}

export function getSafeProductUrl(product: Pick<ProductResult, "url">) {
  try {
    const url = new URL(product.url ?? "");

    if (url.protocol === "https:" || url.protocol === "http:") {
      return url.toString();
    }
  } catch {
    return "#";
  }

  return "#";
}
