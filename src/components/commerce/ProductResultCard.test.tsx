import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

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
    await userEvent.click(screen.getByRole("button", { name: /View Product/i }));

    expect(onCompare).toHaveBeenCalledWith(product);
    expect(onOpenDetails).toHaveBeenCalledWith(product);
  });
});
