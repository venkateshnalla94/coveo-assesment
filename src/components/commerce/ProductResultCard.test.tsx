import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const storeProductForPdpMock = vi.fn();

vi.mock("@/lib/commerce/product-session-cache", () => ({
  storeProductForPdp: (...args: unknown[]) => storeProductForPdpMock(...args),
}));

import { ProductResultCard } from "@/components/commerce/ProductResultCard";
import type { ProductResult } from "@/features/commerce/models/commerce-models";

const product: ProductResult = {
  brand: "NexBot Robotics",
  categories: ["Robots", "Robots|Collaborative Robots"],
  compatibleJoints: ["J6"],
  compatiblePartsSkus: [],
  compatibleRobotSeries: ["C-10"],
  compatibleRobots: ["C-10"],
  description: "Confirmed product description",
  id: "NXB-1",
  images: [],
  inStock: true,
  price: 18500,
  rating: 4.2,
  title: "Collaborative Robot Arm 5kg Payload",
  url: "https://robotics.example/p/NXB-1",
};

afterEach(() => {
  storeProductForPdpMock.mockReset();
  cleanup();
});

describe("ProductResultCard", () => {
  it("renders confirmed Commerce fields and actions", async () => {
    const onCompare = vi.fn();
    const onOpenDetails = vi.fn();

    render(
      <ProductResultCard
        compareDisabled={false}
        isCompared={false}
        onCompare={onCompare}
        onOpenDetails={onOpenDetails}
        product={product}
      />,
    );

    expect(screen.getByRole("heading", { name: /Collaborative Robot Arm/i })).toBeTruthy();
    expect(screen.getByText("NexBot Robotics")).toBeTruthy();
    expect(screen.getByText("£18,500")).toBeTruthy();
    expect(screen.getByText("C-10")).toBeTruthy();

    await userEvent.click(screen.getByRole("button", { name: /Compare/i }));
    await userEvent.click(screen.getByRole("button", { name: /Quick view product/i }));

    expect(onCompare).toHaveBeenCalledWith(product);
    expect(onOpenDetails).toHaveBeenCalledWith(product);
  });

  it("stores the product and opens the PDP in a new tab on a plain click of the title link", async () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    render(
      <ProductResultCard
        compareDisabled={false}
        isCompared={false}
        onCompare={vi.fn()}
        onOpenDetails={vi.fn()}
        product={product}
      />,
    );

    const titleLink = screen.getByRole("link", { name: "Collaborative Robot Arm 5kg Payload" });
    await userEvent.click(titleLink);

    expect(storeProductForPdpMock).toHaveBeenCalledWith(product);
    expect(openSpy).toHaveBeenCalledWith(`/products/${encodeURIComponent(product.id)}`, "_blank");
  });

  it("stores the product and opens the PDP in a new tab on a plain click of the image link", async () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    render(
      <ProductResultCard
        compareDisabled={false}
        isCompared={false}
        onCompare={vi.fn()}
        onOpenDetails={vi.fn()}
        product={product}
      />,
    );

    const imageLink = screen.getByRole("link", { name: /Open .* product page in a new tab/i });
    await userEvent.click(imageLink);

    expect(storeProductForPdpMock).toHaveBeenCalledWith(product);
    expect(openSpy).toHaveBeenCalledWith(`/products/${encodeURIComponent(product.id)}`, "_blank");
  });

  it("leaves modifier clicks to native anchor handling instead of calling window.open", async () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    render(
      <ProductResultCard
        compareDisabled={false}
        isCompared={false}
        onCompare={vi.fn()}
        onOpenDetails={vi.fn()}
        product={product}
      />,
    );

    const titleLink = screen.getByRole("link", { name: "Collaborative Robot Arm 5kg Payload" });
    fireEvent.click(titleLink, { ctrlKey: true });

    expect(storeProductForPdpMock).toHaveBeenCalledWith(product);
    expect(openSpy).not.toHaveBeenCalled();
  });
});
