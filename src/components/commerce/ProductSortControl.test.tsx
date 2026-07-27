import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProductSortControl } from "@/components/commerce/ProductSortControl";

afterEach(() => {
  cleanup();
});

describe("ProductSortControl", () => {
  it("renders a read-only label when zero sort options are available", () => {
    render(<ProductSortControl appliedSort="" availableSorts={[]} onSortChange={vi.fn()} />);

    expect(screen.queryByRole("combobox", { name: "Sort by" })).toBeNull();
    expect(screen.getByText("Relevance", { selector: ".sort-readonly" })).not.toBeNull();
  });

  it("renders a read-only label when exactly one sort option is available", () => {
    render(
      <ProductSortControl
        appliedSort="relevance"
        availableSorts={[{ id: "relevance", label: "Relevance" }]}
        onSortChange={vi.fn()}
      />,
    );

    expect(screen.queryByRole("combobox", { name: "Sort by" })).toBeNull();
    expect(screen.getByText("Relevance", { selector: ".sort-readonly" })).not.toBeNull();
  });

  it("renders a select and calls onSortChange when multiple options are available", async () => {
    const onSortChange = vi.fn();
    render(
      <ProductSortControl
        appliedSort="relevance"
        availableSorts={[
          { id: "relevance", label: "Relevance" },
          { id: "ec_price:desc", label: "Price (High to Low)" },
        ]}
        onSortChange={onSortChange}
      />,
    );

    const select = screen.getByRole<HTMLSelectElement>("combobox", { name: "Sort by" });
    expect(select.value).toBe("relevance");

    await userEvent.selectOptions(select, "ec_price:desc");

    expect(onSortChange).toHaveBeenCalledWith("ec_price:desc");
  });
});
