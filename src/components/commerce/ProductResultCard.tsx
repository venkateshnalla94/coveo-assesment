"use client";

/* eslint-disable @next/next/no-img-element */
import { ExternalLink, GitCompareArrows, Star } from "lucide-react";

import {
  formatPrice,
  formatRating,
  getLeafCategory,
  getSafeProductUrl,
} from "@/components/commerce/product-formatters";
import type { ProductResult } from "@/features/commerce/models/commerce-models";

export function ProductResultCard({
  compareDisabled,
  isCompared,
  onCompare,
  onOpenDetails,
  product,
}: {
  compareDisabled: boolean;
  isCompared: boolean;
  onCompare: (product: ProductResult) => void;
  onOpenDetails: (product: ProductResult) => void;
  product: ProductResult;
}) {
  const category = getLeafCategory(product);
  const safeUrl = getSafeProductUrl(product);

  return (
    <article className="product-card">
      <div className="product-image-wrap">
        {product.imageUrl ? (
          <img alt="" className="product-image" loading="lazy" src={product.imageUrl} />
        ) : (
          <span>No image</span>
        )}
        {product.inStock !== undefined ? (
          <span className={`stock-pill ${product.inStock ? "stock-pill-in" : "stock-pill-out"}`}>
            {product.inStock ? "In stock" : "Unavailable"}
          </span>
        ) : null}
      </div>

      <div className="product-card-body">
        <div>
          {product.brand ? <p className="product-brand">{product.brand}</p> : null}
          <h2>{product.title}</h2>
          {category ? <p className="product-category">{category}</p> : null}
          <p className="product-description">{product.description}</p>
        </div>

        <dl className="product-meta-grid">
          <div>
            <dt>Price</dt>
            <dd>{formatPrice(product.promoPrice ?? product.price)}</dd>
          </div>
          <div>
            <dt>Rating</dt>
            <dd>
              <Star aria-hidden="true" size={14} />
              {formatRating(product.rating)}
            </dd>
          </div>
          {product.compatibleRobotSeries.length > 0 ? (
            <div>
              <dt>Compatible Robots</dt>
              <dd>{product.compatibleRobotSeries.slice(0, 3).join(", ")}</dd>
            </div>
          ) : null}
        </dl>

        <div className="product-card-actions">
          <button
            aria-pressed={isCompared}
            className="secondary-button compare-button"
            disabled={compareDisabled && !isCompared}
            onClick={() => onCompare(product)}
            type="button"
          >
            <GitCompareArrows aria-hidden="true" size={16} />
            {isCompared ? "Compared" : "Compare"}
          </button>
          <button className="primary-text-button" onClick={() => onOpenDetails(product)} type="button">
            View Product
            {safeUrl !== "#" ? <ExternalLink aria-hidden="true" size={15} /> : null}
          </button>
        </div>
      </div>
    </article>
  );
}
