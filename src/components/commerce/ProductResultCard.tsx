"use client";

/* eslint-disable @next/next/no-img-element */
import { Eye, GitCompareArrows, Star } from "lucide-react";
import Link from "next/link";
import type { MouseEvent } from "react";

import { HighlightedText } from "@/components/commerce/HighlightedText";
import {
  formatPrice,
  formatRating,
  getLeafCategory,
} from "@/components/commerce/product-formatters";
import type { ProductResult } from "@/features/commerce/models/commerce-models";
import { storeProductForPdp } from "@/lib/commerce/product-session-cache";

// Commerce search never re-fetches a single product, so the PDP relies on the new tab inheriting
// this tab's sessionStorage. That inheritance needs an opener relationship, which a plain
// `<a target="_blank">` click doesn't reliably establish — window.open() does. Modifier/middle
// clicks are left to the browser's native handling (and the PDP's own "not found" fallback).
function openInNewTab(
  event: MouseEvent<HTMLAnchorElement>,
  product: ProductResult,
  href: string,
  onProductClick: (product: ProductResult) => void,
) {
  storeProductForPdp(product);
  onProductClick(product);

  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }

  event.preventDefault();
  window.open(href, "_blank");
}

export function ProductResultCard({
  compareDisabled,
  imagePriority = false,
  isCompared,
  onCompare,
  onOpenDetails,
  onProductClick,
  product,
}: {
  compareDisabled: boolean;
  imagePriority?: boolean;
  isCompared: boolean;
  onCompare: (product: ProductResult) => void;
  onOpenDetails: (product: ProductResult) => void;
  onProductClick: (product: ProductResult) => void;
  product: ProductResult;
}) {
  const category = getLeafCategory(product);
  const pdpHref = `/products/${encodeURIComponent(product.id)}`;

  return (
    <article className="product-card">
      <Link
        aria-label={`Open ${product.title} product page in a new tab`}
        className="product-tile-link"
        href={pdpHref}
        onClick={(event) => openInNewTab(event, product, pdpHref, onProductClick)}
        target="_blank"
      >
        <div className="product-image-wrap">
          {product.imageUrl ? (
            <img
              alt=""
              className="product-image"
              decoding="async"
              fetchPriority={imagePriority ? "high" : "auto"}
              height={172}
              loading={imagePriority ? "eager" : "lazy"}
              src={product.imageUrl}
              width={320}
            />
          ) : (
            <span>No image</span>
          )}
          {product.inStock !== undefined ? (
            <span className={`stock-pill ${product.inStock ? "stock-pill-in" : "stock-pill-out"}`}>
              {product.inStock ? "In stock" : "Unavailable"}
            </span>
          ) : null}
        </div>
      </Link>

      <div className="product-card-body">
        <div>
          {product.brand ? <p className="product-brand">{product.brand}</p> : null}
          <h2>
            <Link
              className="product-title-link"
              href={pdpHref}
              onClick={(event) => openInNewTab(event, product, pdpHref, onProductClick)}
              target="_blank"
            >
              <HighlightedText highlights={product.nameHighlights} text={product.title} />
            </Link>
          </h2>
          {category ? <p className="product-category">{category}</p> : null}
          <p className="product-description">
            {product.excerpt && product.excerptHighlights ? (
              <HighlightedText highlights={product.excerptHighlights} text={product.excerpt} />
            ) : (
              product.description
            )}
          </p>
        </div>

        <dl className="product-meta-grid">
          <div>
            <dt>Price</dt>
            <dd>{formatPrice(product.price)}</dd>
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
              <dt>Compatible Robot Series</dt>
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
          <button
            aria-label="Quick view product"
            className="primary-text-button"
            onClick={() => onOpenDetails(product)}
            type="button"
          >
            <Eye aria-hidden="true" size={14} />
            Quick View
          </button>
        </div>
      </div>
    </article>
  );
}
