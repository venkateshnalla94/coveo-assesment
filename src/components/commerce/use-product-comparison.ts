import { useState } from "react";

import type { Analytics } from "@/features/analytics/analytics";
import type { ProductResult } from "@/features/commerce/models/commerce-models";

const MAX_COMPARED_PRODUCTS = 3;

export function useProductComparison(analytics: Analytics) {
  const [comparedProducts, setComparedProducts] = useState<ProductResult[]>([]);
  const [comparisonOpen, setComparisonOpen] = useState(false);

  function toggleCompare(product: ProductResult) {
    setComparedProducts((current) => {
      if (current.some((item) => item.id === product.id)) {
        analytics.track("product_compare_removed", { productId: product.id });
        return current.filter((item) => item.id !== product.id);
      }

      if (current.length >= MAX_COMPARED_PRODUCTS) {
        return current;
      }

      analytics.track("product_compare_added", { productId: product.id });
      return [...current, product];
    });
  }

  function removeComparedProduct(productId: string) {
    analytics.track("product_compare_removed", { productId });
    setComparedProducts((current) => current.filter((product) => product.id !== productId));
  }

  function openComparison() {
    analytics.track("product_compare_opened", { count: comparedProducts.length });
    setComparisonOpen(true);
  }

  function closeComparison() {
    setComparisonOpen(false);
  }

  function clearComparison() {
    setComparedProducts([]);
  }

  return {
    comparedProducts,
    comparisonOpen,
    toggleCompare,
    removeComparedProduct,
    openComparison,
    closeComparison,
    clearComparison,
  };
}
