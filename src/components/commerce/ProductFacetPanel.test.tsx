import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  ProductFacetPanel,
  toggleProductFacetSelection,
  toggleProductRangeSelection,
} from "@/components/commerce/ProductFacetPanel";

describe("ProductFacetPanel", () => {
  it("renders regular and range facets with accessible controls", async () => {
    const onToggleFacetValue = vi.fn();
    const onToggleRange = vi.fn();

    render(
      <ProductFacetPanel
        facets={[
          {
            field: "ec_brand",
            id: "ec_brand",
            label: "Brand",
            type: "regular",
            values: [{ count: 2, label: "NexBot Robotics", selected: false, value: "NexBot Robotics" }],
          },
          {
            domain: { increment: 0, max: 100, min: 10 },
            field: "ec_price",
            id: "ec_price",
            label: "Price",
            type: "numericalRange",
            values: [{ count: 2, end: 100, endInclusive: true, selected: false, start: 10 }],
          },
        ]}
        onClearAll={vi.fn()}
        onClearFacet={vi.fn()}
        onToggleFacetValue={onToggleFacetValue}
        onToggleRange={onToggleRange}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /NexBot Robotics 2/i }));
    await userEvent.click(screen.getByRole("button", { name: /£10-£100/i }));

    expect(onToggleFacetValue).toHaveBeenCalledWith("ec_brand", "NexBot Robotics", "regular");
    expect(onToggleRange).toHaveBeenCalledWith("ec_price", 10, 100);
  });

  it("toggles facet selections", () => {
    expect(toggleProductFacetSelection([], "ec_brand", "NexBot Robotics", "regular")).toEqual([
      { field: "ec_brand", type: "regular", values: ["NexBot Robotics"] },
    ]);
    expect(toggleProductRangeSelection([], "ec_rating", 3.5, 5)).toEqual([
      { end: 5, field: "ec_rating", start: 3.5, type: "numericalRange" },
    ]);
  });
});
