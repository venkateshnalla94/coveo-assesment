import { ChevronLeft, ChevronRight } from "lucide-react";

import type { PaginationState } from "@/features/search/services/pagination";

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

      {Array.from({ length: pagination.totalPages }, (_, index) => index + 1).map((page) => (
        <button
          aria-current={pagination.currentPage === page ? "page" : undefined}
          className="page-button"
          key={page}
          onClick={() => onSelectPage(page)}
          type="button"
        >
          {page}
        </button>
      ))}

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
