"use client";

import type { Pager } from "@coveo/headless";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { useControllerState } from "@/lib/coveo/use-controller-state";

export function PagerControls({ controller }: { controller: Pager }) {
  const state = useControllerState(controller);

  if (state.maxPage <= 1) {
    return null;
  }

  return (
    <nav className="pager" aria-label="Pagination">
      <button
        aria-label="Previous page"
        className="icon-button"
        disabled={!state.hasPreviousPage}
        onClick={() => controller.previousPage()}
        type="button"
      >
        <ChevronLeft aria-hidden="true" size={18} />
      </button>

      {state.currentPages.map((page) => (
        <button
          aria-current={state.currentPage === page ? "page" : undefined}
          className="page-button"
          key={page}
          onClick={() => controller.selectPage(page)}
          type="button"
        >
          {page}
        </button>
      ))}

      <button
        aria-label="Next page"
        className="icon-button"
        disabled={!state.hasNextPage}
        onClick={() => controller.nextPage()}
        type="button"
      >
        <ChevronRight aria-hidden="true" size={18} />
      </button>
    </nav>
  );
}
