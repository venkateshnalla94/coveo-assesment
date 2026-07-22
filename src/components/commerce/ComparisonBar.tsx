/* eslint-disable @next/next/no-img-element */
import { X } from "lucide-react";

import { formatPrice } from "@/components/commerce/product-formatters";
import type { ProductResult } from "@/features/commerce/models/commerce-models";

export function ComparisonBar({
  onClear,
  onOpen,
  onRemove,
  products,
}: {
  onClear: () => void;
  onOpen: () => void;
  onRemove: (productId: string) => void;
  products: ProductResult[];
}) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="comparison-bar" aria-label="Product comparison">
      <div>
        <strong>
          {products.length} {products.length === 1 ? "product" : "products"} selected
        </strong>
        <p>You can compare up to 3 products.</p>
        <button className="link-button" onClick={onClear} type="button">
          Clear all
        </button>
      </div>
      <div className="comparison-items">
        {products.map((product) => (
          <div className="comparison-chip" key={product.id}>
            {product.imageUrl ? <img alt="" src={product.imageUrl} /> : null}
            <span>
              <strong>{product.id}</strong>
              <small>{formatPrice(product.promoPrice ?? product.price)}</small>
            </span>
            <button aria-label={`Remove ${product.title} from comparison`} onClick={() => onRemove(product.id)} type="button">
              <X aria-hidden="true" size={15} />
            </button>
          </div>
        ))}
      </div>
      <button className="primary-text-button" onClick={onOpen} type="button">
        Compare ({products.length})
      </button>
    </section>
  );
}
