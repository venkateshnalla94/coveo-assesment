import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProductResultsColumn } from "@/components/commerce/ProductResultsColumn";
import type { ProductResult } from "@/features/commerce/models/commerce-models";
import { defaultSearchFeatureFlags } from "@/lib/features/search-feature-flags";
import { InMemoryFeedbackProvider } from "@/features/generative/providers/feedback-provider";
import type { GenerativeProvider } from "@/features/generative/providers/generative-provider";

// Feature flags keep generative answers disabled and the provider is a stub, so
// GenerativeAnswer renders null and never calls `generate` — this suite is only about
// ProductResultsColumn's own status/pagination/sort branching, not the generative panel.
const noopGenerativeProvider: GenerativeProvider = {
  generate: vi.fn().mockResolvedValue(null),
};

function baseProps(overrides: Partial<Parameters<typeof ProductResultsColumn>[0]> = {}) {
  return {
    appliedSort: "relevance",
    availableSorts: [{ id: "relevance", label: "Relevance" }],
    comparedProducts: [] as ProductResult[],
    committedQuery: "welding arm",
    didYouMean: undefined,
    errorMessage: undefined,
    featureFlags: defaultSearchFeatureFlags,
    feedbackProvider: new InMemoryFeedbackProvider(),
    generativeProvider: noopGenerativeProvider,
    isLoading: false,
    onClearAllFacets: vi.fn(),
    onCompare: vi.fn(),
    onOpenDetails: vi.fn(),
    onProductClick: vi.fn(),
    onRetry: vi.fn(),
    onSelectPage: vi.fn(),
    onSortChange: vi.fn(),
    pagination: undefined,
    products: undefined as ProductResult[] | undefined,
    query: "welding arm",
    status: "success" as const,
    ...overrides,
  };
}

function makeProduct(overrides: Partial<ProductResult> = {}): ProductResult {
  return {
    categories: [],
    compatibleJoints: [],
    compatiblePartsSkus: [],
    compatibleRobotSeries: [],
    compatibleRobots: [],
    description: "Description",
    id: "P1",
    images: [],
    title: "Product 1",
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

describe("ProductResultsColumn", () => {
  it("shows a loading skeleton when loading with no products yet", () => {
    render(<ProductResultsColumn {...baseProps({ isLoading: true, products: undefined, status: "loading" })} />);

    expect(screen.getByRole("status", { name: "Loading products" })).not.toBeNull();
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("shows the error message and wires the retry button to onRetry", async () => {
    const onRetry = vi.fn();
    render(
      <ProductResultsColumn
        {...baseProps({ errorMessage: "Something went wrong", onRetry, status: "error" })}
      />,
    );

    expect(screen.getByRole("alert").textContent).toContain("Something went wrong");
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders the product grid on success with products", () => {
    const products = [makeProduct({ id: "P1" }), makeProduct({ id: "P2", title: "Product 2" })];
    render(
      <ProductResultsColumn
        {...baseProps({
          pagination: { page: 0, perPage: 24, totalEntries: 2, totalPages: 1, totalProducts: 2 },
          products,
          status: "success",
        })}
      />,
    );

    expect(screen.getByRole("list")).not.toBeNull();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.queryByText("No products found for welding arm")).toBeNull();
  });

  it("shows the empty state wired to onClearAllFacets when products is an empty array", async () => {
    const onClearAllFacets = vi.fn();
    render(
      <ProductResultsColumn
        {...baseProps({ onClearAllFacets, products: [], query: "gizmo", status: "empty" })}
      />,
    );

    expect(screen.getByText("No products found for gizmo")).not.toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(onClearAllFacets).toHaveBeenCalledTimes(1);
  });

  it("omits pagination when totalPages is 1 or fewer", () => {
    render(
      <ProductResultsColumn
        {...baseProps({
          pagination: { page: 0, perPage: 24, totalEntries: 1, totalPages: 1, totalProducts: 1 },
          products: [makeProduct()],
        })}
      />,
    );

    expect(screen.queryByRole("navigation", { name: "Pagination" })).toBeNull();
  });

  it("renders pagination and wires page selection to onSelectPage when totalPages > 1", async () => {
    const onSelectPage = vi.fn();
    render(
      <ProductResultsColumn
        {...baseProps({
          onSelectPage,
          pagination: { page: 0, perPage: 24, totalEntries: 48, totalPages: 2, totalProducts: 48 },
          products: [makeProduct()],
        })}
      />,
    );

    const nav = screen.getByRole("navigation", { name: "Pagination" });
    expect(nav).not.toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(onSelectPage).toHaveBeenCalledWith(2);
  });

  it("passes didYouMean through to the status summary", () => {
    render(
      <ProductResultsColumn
        {...baseProps({
          didYouMean: {
            correctedTo: "gripper arm",
            originalQuery: "griper arm",
            wasAutomaticallyCorrected: true,
          },
          pagination: { page: 0, perPage: 24, totalEntries: 1, totalPages: 1, totalProducts: 1 },
          products: [makeProduct()],
          query: "gripper arm",
        })}
      />,
    );

    const correctionNote = screen.getByText(/instead of/i);
    expect(correctionNote.textContent).toContain("gripper arm");
    expect(correctionNote.textContent).toContain("griper arm");
  });

  it("renders a read-only sort label with one option and a select wired to onSortChange with multiple options", async () => {
    const onSortChange = vi.fn();
    render(
      <ProductResultsColumn
        {...baseProps({
          availableSorts: [
            { id: "relevance", label: "Relevance" },
            { id: "ec_price:desc", label: "Price (High to Low)" },
          ],
          onSortChange,
        })}
      />,
    );

    const select = screen.getByRole<HTMLSelectElement>("combobox", { name: "Sort by" });
    await userEvent.selectOptions(select, "ec_price:desc");
    expect(onSortChange).toHaveBeenCalledWith("ec_price:desc");
  });
});
