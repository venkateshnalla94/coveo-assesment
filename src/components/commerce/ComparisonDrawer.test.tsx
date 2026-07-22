import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ComparisonDrawer } from "@/components/commerce/ComparisonDrawer";
import type { ProductResult } from "@/features/commerce/models/commerce-models";

afterEach(() => {
  cleanup();
});

describe("ComparisonDrawer", () => {
  it("compares only confirmed product fields", () => {
    const products: ProductResult[] = [
      {
        brand: "NexBot",
        categories: ["Robots"],
        compatibleJoints: ["J6"],
        compatiblePartsSkus: [],
        compatibleRobotSeries: ["C-10"],
        compatibleRobots: ["C-10"],
        description: "Description",
        id: "P1",
        images: [],
        inStock: true,
        price: 100,
        rating: 4,
        title: "Product 1",
      },
    ];

    render(<ComparisonDrawer onClose={vi.fn()} products={products} />);

    expect(screen.getByRole("dialog", { name: "Compare products" })).toBeTruthy();
    expect(screen.getByRole("rowheader", { name: "Compatible Robot Series" })).toBeTruthy();
    expect(screen.queryByText("Payload")).toBeNull();
    expect(screen.getByRole("columnheader", { name: /Product 1/ })).toBeTruthy();
  });

  it("shows a zero-state instead of disappearing when opened with no products", () => {
    render(<ComparisonDrawer onClose={vi.fn()} products={[]} />);

    expect(screen.getByRole("dialog", { name: "Compare products" })).toBeTruthy();
    expect(screen.getByText(/Add products to compare/i)).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
  });
});
