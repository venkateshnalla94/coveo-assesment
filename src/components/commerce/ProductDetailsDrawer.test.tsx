import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ProductDetailsDrawer } from "@/components/commerce/ProductDetailsDrawer";
import type { ProductResult } from "@/features/commerce/models/commerce-models";

describe("ProductDetailsDrawer", () => {
  it("renders details and demo-safe actions without datasheet claims", async () => {
    const onContactSales = vi.fn();
    const onRequestQuote = vi.fn();
    const product: ProductResult = {
      brand: "NexBot",
      categories: ["Robots"],
      compatibleJoints: ["J6"],
      compatiblePartsSkus: ["P1"],
      compatibleRobotSeries: ["C-10"],
      compatibleRobots: ["C-10"],
      description: "Short",
      fullDescription: "Full",
      id: "P1",
      images: [],
      price: 100,
      rating: 4,
      title: "Product 1",
      url: "https://robotics.example/p/P1",
    };

    render(
      <ProductDetailsDrawer
        onClose={vi.fn()}
        onContactSales={onContactSales}
        onRequestQuote={onRequestQuote}
        product={product}
      />,
    );

    expect(screen.getByRole("dialog", { name: "Product details" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /View Product/i }).getAttribute("href")).toBe(product.url);
    expect(screen.queryByText(/Datasheet/i)).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: /Contact Sales/i }));
    await userEvent.click(screen.getByRole("button", { name: /Request Quote/i }));

    expect(onContactSales).toHaveBeenCalledWith(product);
    expect(onRequestQuote).toHaveBeenCalledWith(product);
  });
});
