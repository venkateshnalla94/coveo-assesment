import { ChevronLeft, ChevronRight } from "lucide-react";

export function SearchResponsePagerControls({
  currentPage,
  maxPage,
  onSelectPage,
}: {
  currentPage: number;
  maxPage: number;
  onSelectPage: (page: number) => void;
}) {
  if (maxPage <= 1) {
    return null;
  }

  return (
    <nav className="pager" aria-label="Pagination">
      <button
        aria-label="Previous page"
        className="icon-button"
        disabled={currentPage <= 1}
        onClick={() => onSelectPage(currentPage - 1)}
        type="button"
      >
        <ChevronLeft aria-hidden="true" size={18} />
      </button>

      {Array.from({ length: maxPage }, (_, index) => index + 1).map((page) => (
        <button
          aria-current={currentPage === page ? "page" : undefined}
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
        disabled={currentPage >= maxPage}
        onClick={() => onSelectPage(currentPage + 1)}
        type="button"
      >
        <ChevronRight aria-hidden="true" size={18} />
      </button>
    </nav>
  );
}
