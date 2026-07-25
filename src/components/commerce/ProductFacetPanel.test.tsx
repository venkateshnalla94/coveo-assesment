import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  ProductFacetPanel,
  toggleProductFacetSelection,
  toggleProductRangeSelection,
} from "@/components/commerce/ProductFacetPanel";

describe("ProductFacetPanel", () => {
  it("renders regular facets and a dynamic price range slider", async () => {
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
            domain: { increment: 1, max: 100, min: 10 },
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

    const [minSlider, maxSlider] = screen.getAllByRole("slider");
    // The range only commits (calls onToggleRange) on blur/keyup/pointerup, not on every
    // change event, so dragging doesn't fire a query per pixel — fire blur to simulate release.
    fireEvent.change(minSlider, { target: { value: "25" } });
    fireEvent.blur(minSlider);
    fireEvent.change(maxSlider, { target: { value: "80" } });
    fireEvent.blur(maxSlider);

    expect(onToggleFacetValue).toHaveBeenCalledWith("ec_brand", "NexBot Robotics", "regular");
    expect(onToggleRange).toHaveBeenCalledWith("ec_price", 25, 100);
    expect(onToggleRange).toHaveBeenCalledWith("ec_price", 25, 80);
  });

  it("selects a star-rating threshold and clears it on repeat click", async () => {
    const onToggleRange = vi.fn();
    const onClearFacet = vi.fn();
    const ratingFacet = {
      domain: { increment: 1, max: 5, min: 0 },
      field: "ec_rating",
      id: "ec_rating",
      label: "Rating",
      type: "numericalRange" as const,
      values: [],
    };

    const { rerender } = render(
      <ProductFacetPanel
        facets={[ratingFacet]}
        onClearAll={vi.fn()}
        onClearFacet={onClearFacet}
        onToggleFacetValue={vi.fn()}
        onToggleRange={onToggleRange}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "3 stars & up" }));
    expect(onToggleRange).toHaveBeenCalledWith("ec_rating", 3, 5);

    rerender(
      <ProductFacetPanel
        facets={[{ ...ratingFacet, selectedRange: { end: 5, endInclusive: true, start: 3 } }]}
        onClearAll={vi.fn()}
        onClearFacet={onClearFacet}
        onToggleFacetValue={vi.fn()}
        onToggleRange={onToggleRange}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "3 stars & up" }));
    expect(onClearFacet).toHaveBeenCalledWith("ec_rating");
  });

  it("removes a single facet value when its breadcrumb chip is clicked, not the whole facet", async () => {
    const onToggleFacetValue = vi.fn();
    const onClearFacet = vi.fn();

    render(
      <ProductFacetPanel
        facets={[
          {
            field: "ec_brand",
            id: "ec_brand",
            label: "Brand",
            type: "regular",
            values: [
              { count: 2, label: "NexBot Robotics", selected: true, value: "NexBot Robotics" },
              { count: 1, label: "Acme Robotics", selected: true, value: "Acme Robotics" },
            ],
          },
        ]}
        onClearAll={vi.fn()}
        onClearFacet={onClearFacet}
        onToggleFacetValue={onToggleFacetValue}
        onToggleRange={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /Brand: NexBot Robotics/i }));

    expect(onToggleFacetValue).toHaveBeenCalledWith("ec_brand", "NexBot Robotics", "regular");
    expect(onClearFacet).not.toHaveBeenCalled();
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
