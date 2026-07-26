"use client";

/* eslint-disable @next/next/no-img-element */
import { ExternalLink, Mail, Phone, X } from "lucide-react";
import { useEffect } from "react";

import {
  formatPrice,
  formatRating,
  getLeafCategory,
  getSafeProductUrl,
} from "@/components/commerce/product-formatters";
import type { ProductResult } from "@/features/commerce/models/commerce-models";

export function ProductDetailsDrawer({
  onClose,
  onContactSales,
  onProductClick,
  onRequestQuote,
  product,
}: {
  onClose: () => void;
  onContactSales: (product: ProductResult) => void;
  onProductClick: (product: ProductResult) => void;
  onRequestQuote: (product: ProductResult) => void;
  product: ProductResult;
}) {
  const safeUrl = getSafeProductUrl(product);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="drawer-backdrop drawer-backdrop-right" role="presentation">
      <section className="product-details-drawer" aria-label="Product details" role="dialog" aria-modal="true">
        <div className="drawer-header">
          <h2>Product Details</h2>
          <button aria-label="Close product details" className="icon-button" onClick={onClose} type="button">
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="details-hero">
          {product.imageUrl ? <img alt="" src={product.imageUrl} /> : null}
          <div>
            <p className="product-brand">{product.brand}</p>
            <h3>{product.title}</h3>
            <p>{getLeafCategory(product)}</p>
            <strong>{formatPrice(product.price)}</strong>
            <span>{formatRating(product.rating)} rating</span>
            {product.inStock !== undefined ? (
              <span className={`stock-pill ${product.inStock ? "stock-pill-in" : "stock-pill-out"}`}>
                {product.inStock ? "In stock" : "Unavailable"}
              </span>
            ) : null}
          </div>
        </div>

        <section className="details-section">
          <h3>Overview</h3>
          <p>{product.fullDescription ?? product.description}</p>
        </section>

        <section className="details-section">
          <h3>Compatibility</h3>
          <dl className="details-list">
            <DetailRow label="Robot Series" values={product.compatibleRobotSeries} />
            <DetailRow label="Compatible Robots" values={product.compatibleRobots} />
            <DetailRow label="Compatible Joints" values={product.compatibleJoints} />
            <DetailRow label="Compatible Part SKUs" values={product.compatiblePartsSkus} />
          </dl>
        </section>

        <div className="details-actions">
          {safeUrl !== "#" ? (
            <a
              className="primary-text-button"
              href={safeUrl}
              onClick={() => onProductClick(product)}
              rel="noreferrer"
              target="_blank"
            >
              View Product
              <ExternalLink aria-hidden="true" size={15} />
            </a>
          ) : null}
          <button className="secondary-button" onClick={() => onContactSales(product)} type="button">
            <Phone aria-hidden="true" size={16} />
            Contact Sales
          </button>
          <button className="secondary-button" onClick={() => onRequestQuote(product)} type="button">
            <Mail aria-hidden="true" size={16} />
            Request Quote
          </button>
        </div>
      </section>
    </div>
  );
}

function DetailRow({ label, values }: { label: string; values: string[] }) {
  if (values.length === 0) {
    return null;
  }

  return (
    <div>
      <dt>{label}</dt>
      <dd>{values.join(", ")}</dd>
    </div>
  );
}
