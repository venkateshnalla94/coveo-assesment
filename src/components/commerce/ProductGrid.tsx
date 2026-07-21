import { ProductResultCard } from "@/components/commerce/ProductResultCard";
import type { ProductResult } from "@/features/commerce/models/commerce-models";

export function ProductGrid({
  comparedProducts,
  onCompare,
  onOpenDetails,
  products,
}: {
  comparedProducts: ProductResult[];
  onCompare: (product: ProductResult) => void;
  onOpenDetails: (product: ProductResult) => void;
  products: ProductResult[];
}) {
  return (
    <div className="product-grid" role="list">
      {products.map((product) => {
        const isCompared = comparedProducts.some((item) => item.id === product.id);

        return (
          <div key={product.id} role="listitem">
            <ProductResultCard
              compareDisabled={comparedProducts.length >= 3}
              isCompared={isCompared}
              onCompare={onCompare}
              onOpenDetails={onOpenDetails}
              product={product}
            />
          </div>
        );
      })}
    </div>
  );
}
