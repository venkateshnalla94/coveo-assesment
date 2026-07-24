import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const readProductForPdpMock = vi.fn();

vi.mock("@/lib/commerce/product-session-cache", () => ({
  readProductForPdp: (id: string) => readProductForPdpMock(id),
}));

import { ProductDetailClient } from "@/components/commerce/ProductDetailClient";
import type { ProductResult } from "@/features/commerce/models/commerce-models";

const product: ProductResult = {
  categories: [],
  compatibleJoints: [],
  compatiblePartsSkus: [],
  compatibleRobotSeries: [],
  compatibleRobots: [],
  description: "A product",
  id: "PROD-1",
  images: [],
  title: "Product One",
};

afterEach(() => {
  readProductForPdpMock.mockReset();
  cleanup();
});

describe("ProductDetailClient", () => {
  it("renders the empty state with a link back to the catalog when no product is stored", () => {
    readProductForPdpMock.mockReturnValue(undefined);

    render(<ProductDetailClient id="missing-id" />);

    expect(screen.getByText("Product details unavailable")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Back to catalog/i }).getAttribute("href")).toBe("/catalog");
  });

  it("renders the product detail view when the product is found", () => {
    readProductForPdpMock.mockReturnValue(product);

    render(<ProductDetailClient id={product.id} />);

    expect(screen.getByRole("heading", { name: "Product One" })).toBeTruthy();
  });

  it("memoizes the snapshot per id so it only reads sessionStorage once per id", () => {
    readProductForPdpMock.mockReturnValue(product);

    const { rerender } = render(<ProductDetailClient id="memo-id" />);
    rerender(<ProductDetailClient id="memo-id" />);
    rerender(<ProductDetailClient id="memo-id" />);

    expect(readProductForPdpMock).toHaveBeenCalledTimes(1);
  });
});
