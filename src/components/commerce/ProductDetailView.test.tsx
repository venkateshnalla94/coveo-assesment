import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { ProductDetailView } from "@/components/commerce/ProductDetailView";
import type { ProductResult } from "@/features/commerce/models/commerce-models";

const baseProduct: ProductResult = {
  categories: [],
  compatibleJoints: [],
  compatiblePartsSkus: [],
  compatibleRobotSeries: [],
  compatibleRobots: [],
  description: "Base description",
  id: "BASE-1",
  images: [],
  title: "Base Product",
};

afterEach(() => {
  cleanup();
});

describe("ProductDetailView", () => {
  it("shows 'No image' when there are no images and no imageUrl", () => {
    render(<ProductDetailView product={baseProduct} />);

    expect(screen.getByText("No image")).toBeTruthy();
  });

  it("falls back to imageUrl as the single gallery image when images is empty", () => {
    render(<ProductDetailView product={{ ...baseProduct, imageUrl: "https://example.com/img.png" }} />);

    const image = screen.getByAltText("Base Product") as HTMLImageElement;
    expect(image.src).toBe("https://example.com/img.png");
    // Only one image means no thumbnail rail.
    expect(screen.queryByRole("button", { name: /Show product image/i })).toBeNull();
  });

  it("renders thumbnails when multiple gallery images exist and swaps the main image on click", async () => {
    const product: ProductResult = {
      ...baseProduct,
      images: ["https://example.com/one.png", "https://example.com/two.png"],
    };

    render(<ProductDetailView product={product} />);

    const thumbButtons = screen.getAllByRole("button", { name: /Show product image/i });
    expect(thumbButtons).toHaveLength(2);

    const mainImage = screen.getByAltText("Base Product") as HTMLImageElement;
    expect(mainImage.src).toBe("https://example.com/one.png");

    await userEvent.click(thumbButtons[1]);

    expect((screen.getByAltText("Base Product") as HTMLImageElement).src).toBe("https://example.com/two.png");
  });

  it("shows a struck-through original price only when promoPrice is defined and lower than price", () => {
    const { rerender } = render(<ProductDetailView product={{ ...baseProduct, price: 100, promoPrice: 80 }} />);

    expect(screen.getByText("£80")).toBeTruthy();
    expect(screen.getByText("£100")).toBeTruthy();

    rerender(<ProductDetailView product={{ ...baseProduct, price: 100, promoPrice: 120 }} />);

    // promoPrice not lower than price -> no discount, only price shown.
    expect(screen.getByText("£100")).toBeTruthy();
    expect(screen.queryByText("£120")).toBeNull();
  });

  it("shows only price when promoPrice is undefined", () => {
    render(<ProductDetailView product={{ ...baseProduct, price: 100 }} />);

    expect(screen.getByText("£100")).toBeTruthy();
  });

  it("renders a breadcrumb split from the leaf category", () => {
    render(<ProductDetailView product={{ ...baseProduct, categories: ["Robots", "Robots|Arms|Collaborative"] }} />);

    expect(screen.getByRole("navigation", { name: "Breadcrumb" }).textContent).toBe("Robots / Arms / Collaborative");
  });

  it("omits the breadcrumb when there are no categories", () => {
    render(<ProductDetailView product={baseProduct} />);

    expect(screen.queryByRole("navigation", { name: "Breadcrumb" })).toBeNull();
  });

  it("always shows a Product ID spec, using permanentId when present", () => {
    render(
      <ProductDetailView
        product={{ ...baseProduct, providerMetadata: { permanentId: "PERM-123" } }}
      />,
    );

    expect(screen.getByText("Product ID")).toBeTruthy();
    expect(screen.getByText("PERM-123")).toBeTruthy();
  });

  it("falls back to product.id for Product ID when permanentId is absent", () => {
    render(<ProductDetailView product={baseProduct} />);

    expect(screen.getByText("BASE-1")).toBeTruthy();
  });

  it("shows Brand and Item Group specs only when present", () => {
    const { rerender } = render(<ProductDetailView product={baseProduct} />);

    expect(screen.queryByText("Item Group")).toBeNull();

    rerender(<ProductDetailView product={{ ...baseProduct, brand: "Acme", itemGroupId: "GROUP-1" }} />);

    expect(screen.getAllByText("Acme").length).toBeGreaterThan(0);
    expect(screen.getByText("Item Group")).toBeTruthy();
    expect(screen.getByText("GROUP-1")).toBeTruthy();
  });

  it("renders the compatibility section only when at least one compatibility list is non-empty", () => {
    const { rerender } = render(<ProductDetailView product={baseProduct} />);

    expect(screen.queryByText("Compatibility")).toBeNull();

    rerender(
      <ProductDetailView
        product={{
          ...baseProduct,
          compatibleJoints: ["J1"],
          compatiblePartsSkus: ["SKU-1"],
          compatibleRobotSeries: ["C-10", "C-20"],
          compatibleRobots: ["R-1"],
        }}
      />,
    );

    expect(screen.getByText("Compatibility")).toBeTruthy();
    expect(screen.getByText("C-10, C-20")).toBeTruthy();
    expect(screen.getByText("R-1")).toBeTruthy();
    expect(screen.getByText("J1")).toBeTruthy();
    expect(screen.getByText("SKU-1")).toBeTruthy();
  });

  it("shows an in-stock or unavailable pill based on product.inStock, and nothing when undefined", () => {
    const { rerender } = render(<ProductDetailView product={{ ...baseProduct, inStock: true }} />);

    expect(screen.getByText("In stock")).toBeTruthy();

    rerender(<ProductDetailView product={{ ...baseProduct, inStock: false }} />);

    expect(screen.getByText("Unavailable")).toBeTruthy();

    rerender(<ProductDetailView product={baseProduct} />);

    expect(screen.queryByText("In stock")).toBeNull();
    expect(screen.queryByText("Unavailable")).toBeNull();
  });

  it("prefers fullDescription over description for the overview and hides section when both absent", () => {
    const { rerender } = render(
      <ProductDetailView product={{ ...baseProduct, description: "", fullDescription: "Full text" }} />,
    );

    expect(screen.getByText("Full text")).toBeTruthy();

    rerender(<ProductDetailView product={{ ...baseProduct, description: "" }} />);

    expect(screen.queryByText("Overview")).toBeNull();
  });

  it("renders the external View Product link only when getSafeProductUrl is not '#'", () => {
    const { rerender } = render(<ProductDetailView product={baseProduct} />);

    expect(screen.queryByRole("link", { name: /View Product/i })).toBeNull();

    rerender(<ProductDetailView product={{ ...baseProduct, url: "https://example.com/product" }} />);

    const link = screen.getByRole("link", { name: /View Product/i });
    expect(link.getAttribute("href")).toBe("https://example.com/product");
  });
});
