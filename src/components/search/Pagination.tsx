import { ChevronLeft, ChevronRight } from "lucide-react";

export type PaginationState = {
  currentPage: number;
  firstResult: number;
  lastResult: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

/**
 * Bounds the number of rendered page buttons: always page 1, the last page, and a small
 * window around the current page, collapsing gaps into "…" markers. Without this, a query
 * with dozens of pages renders one button per page and overflows the results column.
 */
export function getPageWindow(currentPage: number, totalPages: number, siblingCount = 1) {
  const window: Array<number | "…"> = [];
  const start = Math.max(2, currentPage - siblingCount);
  const end = Math.min(totalPages - 1, currentPage + siblingCount);

  window.push(1);
  if (start > 2) {
    window.push("…");
  }
  for (let page = start; page <= end; page += 1) {
    window.push(page);
  }
  if (end < totalPages - 1) {
    window.push("…");
  }
  if (totalPages > 1) {
    window.push(totalPages);
  }

  return window;
}

export function Pagination({
  onSelectPage,
  pagination,
}: {
  onSelectPage: (page: number) => void;
  pagination: PaginationState;
}) {
  if (pagination.totalPages <= 1) {
    return null;
  }

  return (
    <nav className="pager" aria-label="Pagination">
      <button
        aria-label="Previous page"
        className="icon-button"
        disabled={pagination.currentPage <= 1}
        onClick={() => onSelectPage(pagination.currentPage - 1)}
        type="button"
      >
        <ChevronLeft aria-hidden="true" size={18} />
      </button>

      {getPageWindow(pagination.currentPage, pagination.totalPages).map((page, index) =>
        page === "…" ? (
          <span aria-hidden="true" className="page-ellipsis" key={`ellipsis-${index}`}>
            …
          </span>
        ) : (
          <button
            aria-current={pagination.currentPage === page ? "page" : undefined}
            className="page-button"
            key={page}
            onClick={() => onSelectPage(page)}
            type="button"
          >
            {page}
          </button>
        ),
      )}

      <button
        aria-label="Next page"
        className="icon-button"
        disabled={pagination.currentPage >= pagination.totalPages}
        onClick={() => onSelectPage(pagination.currentPage + 1)}
        type="button"
      >
        <ChevronRight aria-hidden="true" size={18} />
      </button>
    </nav>
  );
}
