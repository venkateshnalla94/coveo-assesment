import type { ProductResult } from "@/features/commerce/models/commerce-models";

// Commerce search runs entirely client-side (see CLAUDE.md: no product-detail API route), so the
// PDP can't re-fetch a product by id. The result card already holds the full ProductResult from
// the search response — this just hands that object to the PDP tab via sessionStorage, which the
// HTML spec copies into same-origin tabs/windows opened via a link `target="_blank"`.
const STORAGE_KEY_PREFIX = "pdp-product:";

export function storeProductForPdp(product: ProductResult) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(`${STORAGE_KEY_PREFIX}${product.id}`, JSON.stringify(product));
  } catch {
    // Storage unavailable (private browsing quota, etc.) — the PDP falls back to its no-data state.
  }
}

export function readProductForPdp(id: string): ProductResult | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    const raw = window.sessionStorage.getItem(`${STORAGE_KEY_PREFIX}${id}`);
    return raw ? (JSON.parse(raw) as ProductResult) : undefined;
  } catch {
    return undefined;
  }
}
