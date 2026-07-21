import type { PaginationState } from "@/features/search/services/pagination";

export function SearchStatus({
  durationMs,
  isLoading,
  pagination,
  query,
}: {
  durationMs?: number;
  isLoading: boolean;
  pagination: PaginationState;
  query: string;
}) {
  if (isLoading) {
    return (
      <p aria-live="polite" className="summary-text">
        Loading results
      </p>
    );
  }

  if (pagination.totalCount === 0) {
    return (
      <p aria-live="polite" className="summary-text">
        No results found{query ? ` for ${query}` : ""}
      </p>
    );
  }

  return (
    <p aria-live="polite" className="summary-text">
      Showing {pagination.firstResult}-{pagination.lastResult} of{" "}
      {pagination.totalCount.toLocaleString()} results{query ? " for " : ""}
      {query ? <strong>{query}</strong> : null}
      {durationMs !== undefined ? ` in ${(durationMs / 1000).toFixed(2)}s` : ""}
    </p>
  );
}
