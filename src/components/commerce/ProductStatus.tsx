import type { ProductPagination } from "@/features/commerce/models/commerce-models";

export function ProductStatus({
  isLoading,
  pagination,
  query,
}: {
  isLoading: boolean;
  pagination?: ProductPagination;
  query: string;
}) {
  if (isLoading) {
    return (
      <p aria-live="polite" className="summary-text">
        Loading products
      </p>
    );
  }

  if (!pagination || pagination.totalProducts === 0) {
    return (
      <p aria-live="polite" className="summary-text">
        No products found{query ? ` for "${query}"` : ""}
      </p>
    );
  }

  const first = pagination.page * pagination.perPage + 1;
  const last = Math.min((pagination.page + 1) * pagination.perPage, pagination.totalProducts);

  return (
    <p aria-live="polite" className="summary-text">
      Showing {first}-{last} of {pagination.totalProducts.toLocaleString()} products for{" "}
      <strong>&quot;{query}&quot;</strong>
    </p>
  );
}
