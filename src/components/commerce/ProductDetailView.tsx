"use client";

/* eslint-disable @next/next/no-img-element */
import { ExternalLink, Star } from "lucide-react";
import { useState } from "react";

import { formatPrice, formatRating, getSafeProductUrl } from "@/components/commerce/product-formatters";
import type { ProductDetail } from "@/features/commerce/models/commerce-models";

// Pure presentational PDP: renders whatever the passed-in product already has and compromises on
// sections it can't fill — no fetching, no Coveo dependency. Rich fields (specs, availability,
// reviews, cross-sell) render only when the server-fetched detail supplies them; a plain
// ProductResult (sessionStorage hand-off) simply omits those sections.
export function ProductDetailView({ product }: { product: ProductDetail }) {
  const gallery = product.images.length > 0 ? product.images : product.imageUrl ? [product.imageUrl] : [];
  const [activeImage, setActiveImage] = useState(gallery[0]);
  const safeUrl = getSafeProductUrl(product);
  const hasDiscount = product.promoPrice !== undefined && product.price !== undefined && product.promoPrice < product.price;
  const displayImage = activeImage ?? gallery[0];
  // Coveo's leaf category entry already carries the full "|"-joined path ("A|B|C") — split it
  // for a breadcrumb instead of joining the whole (redundantly-prefixed) categories array.
  const rawLeafCategory = product.categories.at(-1) ?? product.categories[0];
  const breadcrumb = rawLeafCategory?.split("|") ?? [];

  const specs = [
    product.brand ? { label: "Brand", value: product.brand } : undefined,
    product.sku ? { label: "SKU", value: product.sku } : undefined,
    product.countryOfOrigin ? { label: "Country of Origin", value: product.countryOfOrigin } : undefined,
    product.itemGroupId ? { label: "Item Group", value: product.itemGroupId } : undefined,
    product.providerMetadata?.permanentId
      ? { label: "Product ID", value: product.providerMetadata.permanentId }
      : { label: "Product ID", value: product.id },
  ].filter((spec): spec is { label: string; value: string } => Boolean(spec));

  const specifications = product.specifications ?? [];
  const availabilityRegions = product.availabilityRegions ?? [];
  const recommendedSkus = product.recommendedSkus ?? [];
  const fitmentParentSkus = product.fitmentParentSkus ?? [];

  const compatibility = [
    product.compatibleRobotSeries.length > 0 ? { label: "Robot Series", values: product.compatibleRobotSeries } : undefined,
    product.compatibleRobots.length > 0 ? { label: "Compatible Robots", values: product.compatibleRobots } : undefined,
    product.compatibleJoints.length > 0 ? { label: "Compatible Joints", values: product.compatibleJoints } : undefined,
    product.compatiblePartsSkus.length > 0 ? { label: "Compatible Part SKUs", values: product.compatiblePartsSkus } : undefined,
  ].filter((row): row is { label: string; values: string[] } => Boolean(row));

  const overview = product.fullDescription ?? product.description;

  return (
    <article className="pdp">
      <div className="pdp-gallery">
        <div className="pdp-gallery-main">
          {displayImage ? <img alt={product.title} src={displayImage} /> : <span>No image</span>}
          {product.inStock !== undefined ? (
            <span className={`stock-pill ${product.inStock ? "stock-pill-in" : "stock-pill-out"}`}>
              {product.inStock ? "In stock" : "Unavailable"}
            </span>
          ) : null}
        </div>
        {gallery.length > 1 ? (
          <ul className="pdp-gallery-thumbs">
            {gallery.map((src) => (
              <li key={src}>
                <button
                  aria-current={src === displayImage}
                  aria-label="Show product image"
                  className={`pdp-thumb-button ${src === displayImage ? "pdp-thumb-button-active" : ""}`}
                  onClick={() => setActiveImage(src)}
                  type="button"
                >
                  <img alt="" src={src} />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="pdp-buybox">
        {breadcrumb.length > 0 ? (
          <nav aria-label="Breadcrumb" className="pdp-breadcrumb">
            {breadcrumb.join(" / ")}
          </nav>
        ) : null}

        {product.brand ? <p className="product-brand">{product.brand}</p> : null}
        <h1>{product.title}</h1>

        <div className="pdp-rating-row">
          <span className="pdp-rating">
            <Star aria-hidden="true" size={16} />
            {formatRating(product.rating)}
          </span>
          {product.reviewCount !== undefined ? (
            <span className="pdp-review-count">
              {product.reviewCount} {product.reviewCount === 1 ? "review" : "reviews"}
            </span>
          ) : null}
        </div>

        <div className="pdp-price-row">
          <strong className="pdp-price">{formatPrice(hasDiscount ? product.promoPrice : product.price)}</strong>
          {hasDiscount ? <span className="pdp-price-was">{formatPrice(product.price)}</span> : null}
        </div>

        {product.description ? <p className="pdp-summary">{product.description}</p> : null}

        {safeUrl !== "#" ? (
          <a className="primary-text-button pdp-external-link" href={safeUrl} rel="noreferrer" target="_blank">
            View Product
            <ExternalLink aria-hidden="true" size={15} />
          </a>
        ) : null}

        <dl className="pdp-specs">
          {specs.map((spec) => (
            <div key={spec.label}>
              <dt>{spec.label}</dt>
              <dd>{spec.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {overview ? (
        <section className="pdp-section pdp-overview">
          <h2>Overview</h2>
          <p>{overview}</p>
        </section>
      ) : null}

      {specifications.length > 0 ? (
        <section className="pdp-section pdp-specifications">
          <h2>Specifications</h2>
          <dl className="details-list">
            {specifications.map((spec) => (
              <div key={spec.label}>
                <dt>{spec.label}</dt>
                <dd>{spec.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {compatibility.length > 0 ? (
        <section className="pdp-section pdp-compatibility">
          <h2>Compatibility</h2>
          <dl className="details-list">
            {compatibility.map((row) => (
              <div key={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.values.join(", ")}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {availabilityRegions.length > 0 ? (
        <section className="pdp-section pdp-availability">
          <h2>Availability</h2>
          <ul className="pdp-region-list">
            {availabilityRegions.map((region) => (
              <li key={region}>{region}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {recommendedSkus.length > 0 || fitmentParentSkus.length > 0 ? (
        <section className="pdp-section pdp-recommended">
          <h2>Recommended &amp; compatible parts</h2>
          <dl className="details-list">
            {recommendedSkus.length > 0 ? (
              <div>
                <dt>Frequently paired</dt>
                <dd>{recommendedSkus.join(", ")}</dd>
              </div>
            ) : null}
            {fitmentParentSkus.length > 0 ? (
              <div>
                <dt>Fits parent assemblies</dt>
                <dd>{fitmentParentSkus.join(", ")}</dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}
    </article>
  );
}
