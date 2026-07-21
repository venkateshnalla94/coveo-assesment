import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SearchResults } from "@/components/search/results/SearchResults";

const pagination = {
  currentPage: 1,
  firstResult: 0,
  lastResult: 0,
  pageSize: 4,
  totalCount: 0,
  totalPages: 1,
};

afterEach(() => {
  cleanup();
});

describe("SearchResults", () => {
  it("renders loading and retryable error states", async () => {
    const onRetryQuery = vi.fn();
    const { rerender } = render(
      <SearchResults
        activeFilterCount={0}
        isLoading
        onClearFilters={vi.fn()}
        onRetryQuery={vi.fn()}
        pagination={pagination}
        query="digital"
      />,
    );

    expect(screen.getByRole("status")).toBeTruthy();

    rerender(
      <SearchResults
        activeFilterCount={0}
        error="Provider error"
        isLoading={false}
        onClearFilters={vi.fn()}
        onRetryQuery={onRetryQuery}
        pagination={pagination}
        query="digital"
      />,
    );

    expect(screen.getByRole("alert").textContent).toContain("Provider error");
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetryQuery).toHaveBeenCalledWith("digital");
  });

  it("renders result variants and zero-results recovery", async () => {
    const onClearFilters = vi.fn();
    const onRetryQuery = vi.fn();
    const { rerender } = render(
      <SearchResults
        activeFilterCount={0}
        isLoading={false}
        onClearFilters={onClearFilters}
        onRetryQuery={onRetryQuery}
        pagination={{ ...pagination, firstResult: 1, lastResult: 1, totalCount: 1 }}
        query="digital"
        response={{
          facets: [],
          results: [
            {
              description: "",
              id: "product",
              title: "Product Result With A Very Long Title That Should Wrap Without Breaking Layout",
              type: "product",
              url: "invalid-url",
            },
          ],
          totalCount: 1,
        }}
      />,
    );

    expect(screen.getAllByText("Product").length).toBeGreaterThan(0);
    expect(screen.getByText("Unavailable URL")).toBeTruthy();

    rerender(
      <SearchResults
        activeFilterCount={1}
        isLoading={false}
        onClearFilters={onClearFilters}
        onRetryQuery={onRetryQuery}
        pagination={pagination}
        query="no-match"
        response={{ facets: [], results: [], totalCount: 0 }}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    await userEvent.click(screen.getByRole("button", { name: "Retry broader search" }));

    expect(onClearFilters).toHaveBeenCalled();
    expect(onRetryQuery).toHaveBeenCalledWith("digital transformation");
  });

  it("omits clear filters when no filters are active", async () => {
    render(
      <SearchResults
        activeFilterCount={0}
        isLoading={false}
        onClearFilters={vi.fn()}
        onRetryQuery={vi.fn()}
        pagination={pagination}
        query=""
        response={{ facets: [], results: [], totalCount: 0 }}
      />,
    );

    expect(screen.getByText("No results for this search")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Clear filters" })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "AI search" }));
  });
});
