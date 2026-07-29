import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const readProductForPdpMock = vi.fn();

vi.mock("@/lib/commerce/product-session-cache", () => ({
  readProductForPdp: (id: string) => readProductForPdpMock(id),
}));

import { ProductDetailClient, ProductViewAnalytics } from "@/components/commerce/ProductDetailClient";
import { AnalyticsProviderRoot, type AnalyticsProvider } from "@/features/analytics/analytics";
import type { ProductDetail, ProductResult } from "@/features/commerce/models/commerce-models";

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

const serverProduct: ProductDetail = {
  ...product,
  id: "SERVER-1",
  title: "Server Product",
  specifications: [{ label: "Payload", value: "50 kg" }],
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

  it("renders the server-fetched product (comprehensive detail) when serverProduct is provided", () => {
    readProductForPdpMock.mockReturnValue(undefined);

    render(<ProductDetailClient id="SERVER-1" serverProduct={serverProduct} />);

    expect(screen.getByRole("heading", { name: "Server Product" })).toBeTruthy();
    // Rich section only the server payload carries.
    expect(screen.getByText("Specifications")).toBeTruthy();
    expect(screen.getByText("50 kg")).toBeTruthy();
    // The empty state must not show when the server resolved the product.
    expect(screen.queryByText("Product details unavailable")).toBeNull();
  });

  it("prefers the server product over the sessionStorage cache when both exist", () => {
    readProductForPdpMock.mockReturnValue(product);

    render(<ProductDetailClient id="PROD-1" serverProduct={serverProduct} />);

    expect(screen.getByRole("heading", { name: "Server Product" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Product One" })).toBeNull();
  });

  it("falls back to the sessionStorage cache when the server lookup missed (serverProduct null)", () => {
    readProductForPdpMock.mockReturnValue(product);

    render(<ProductDetailClient id="PROD-1" serverProduct={null} />);

    expect(screen.getByRole("heading", { name: "Product One" })).toBeTruthy();
  });

  it("shows the empty state when neither the server nor sessionStorage has the product", () => {
    readProductForPdpMock.mockReturnValue(undefined);

    render(<ProductDetailClient id="none" serverProduct={null} />);

    expect(screen.getByText("Product details unavailable")).toBeTruthy();
  });

  it("memoizes the snapshot per id so it only reads sessionStorage once per id", () => {
    readProductForPdpMock.mockReturnValue(product);

    const { rerender } = render(<ProductDetailClient id="memo-id" />);
    rerender(<ProductDetailClient id="memo-id" />);
    rerender(<ProductDetailClient id="memo-id" />);

    expect(readProductForPdpMock).toHaveBeenCalledTimes(1);
  });
});

describe("ProductViewAnalytics", () => {
  it("emits a single product_view event with the product id and available details on mount", () => {
    const track = vi.fn();
    const provider: AnalyticsProvider = { track };

    render(
      <AnalyticsProviderRoot enabled provider={provider}>
        <ProductViewAnalytics product={{ ...serverProduct, sku: "SKU-9", brand: "Acme", price: 725.5 }} />
      </AnalyticsProviderRoot>,
    );

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "product_view",
        payload: expect.objectContaining({ productId: "SERVER-1", sku: "SKU-9", brand: "Acme", price: 725.5 }),
      }),
    );
  });

  it("omits absent optional fields from the payload", () => {
    const track = vi.fn();
    const provider: AnalyticsProvider = { track };

    render(
      <AnalyticsProviderRoot enabled provider={provider}>
        <ProductViewAnalytics product={serverProduct} />
      </AnalyticsProviderRoot>,
    );

    const payload = track.mock.calls[0][0].payload as Record<string, unknown>;
    expect(payload.productId).toBe("SERVER-1");
    expect(payload).not.toHaveProperty("sku");
    expect(payload).not.toHaveProperty("price");
  });

  it("does not emit when analytics is disabled by the feature flag", () => {
    const track = vi.fn();
    const provider: AnalyticsProvider = { track };

    render(
      <AnalyticsProviderRoot enabled={false} provider={provider}>
        <ProductViewAnalytics product={serverProduct} />
      </AnalyticsProviderRoot>,
    );

    expect(track).not.toHaveBeenCalled();
  });
});
