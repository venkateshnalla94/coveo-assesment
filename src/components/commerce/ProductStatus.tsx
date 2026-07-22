import type { ProductDidYouMean, ProductPagination } from "@/features/commerce/models/commerce-models";

export function ProductStatus({
  didYouMean,
  isLoading,
  pagination,
  query,
}: {
  didYouMean?: ProductDidYouMean;
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

  const correctionNote = didYouMean ? (
    <p aria-live="polite" className="did-you-mean-note">
      Showing results for <strong>&quot;{didYouMean.correctedTo}&quot;</strong>{" "}
      instead of &quot;{didYouMean.originalQuery}&quot;
    </p>
  ) : null;

  if (!pagination || pagination.totalProducts === 0) {
    return (
      <div>
        {correctionNote}
        <p aria-live="polite" className="summary-text">
          No products found{query ? ` for "${query}"` : ""}
        </p>
      </div>
    );
  }

  const first = pagination.page * pagination.perPage + 1;
  const last = Math.min((pagination.page + 1) * pagination.perPage, pagination.totalProducts);

  return (
    <div>
      {correctionNote}
      <p aria-live="polite" className="summary-text">
        Showing {first}-{last} of {pagination.totalProducts.toLocaleString()} products for{" "}
        <strong>&quot;{query}&quot;</strong>
      </p>
    </div>
  );
}
