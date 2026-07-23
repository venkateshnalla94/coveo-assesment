"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

import {
  formatPrice,
  formatRating,
  getLeafCategory,
} from "@/components/commerce/product-formatters";
import type { ProductResult } from "@/features/commerce/models/commerce-models";

export function ComparisonDrawer({
  onClose,
  products,
}: {
  onClose: () => void;
  products: ProductResult[];
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const rows = getComparisonRows(products);

  return (
    <div className="drawer-backdrop" role="presentation">
      <section className="comparison-drawer" aria-label="Compare products" role="dialog" aria-modal="true">
        <div className="drawer-header">
          <h2>Compare Products ({products.length})</h2>
          <button aria-label="Close comparison" className="icon-button" onClick={onClose} type="button">
            <X aria-hidden="true" size={18} />
          </button>
        </div>
        {products.length === 0 ? (
          <p className="comparison-empty-state">Add products to compare to see them side by side.</p>
        ) : (
          <div className="comparison-table-wrap">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th scope="col">Field</th>
                  {products.map((product) => (
                    <th scope="col" key={product.id}>
                      <span>{product.title}</span>
                      <small>{product.id}</small>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    {row.values.map((value, index) => (
                      <td key={`${row.label}-${products[index].id}`}>{value || "Not available"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function getComparisonRows(products: ProductResult[]) {
  const rows = [
    { label: "Brand", values: products.map((product) => product.brand) },
    { label: "Category", values: products.map((product) => getLeafCategory(product)) },
    { label: "Price", values: products.map((product) => formatPrice(product.price)) },
    { label: "Rating", values: products.map((product) => formatRating(product.rating)) },
    { label: "Availability", values: products.map((product) => (product.inStock === undefined ? undefined : product.inStock ? "In stock" : "Unavailable")) },
    { label: "Compatible Robot Series", values: products.map((product) => product.compatibleRobotSeries.join(", ")) },
    { label: "Compatible Robots", values: products.map((product) => product.compatibleRobots.join(", ")) },
    { label: "Compatible Joints", values: products.map((product) => product.compatibleJoints.join(", ")) },
  ];

  return rows.filter((row) => row.values.some((value) => Boolean(value)));
}
