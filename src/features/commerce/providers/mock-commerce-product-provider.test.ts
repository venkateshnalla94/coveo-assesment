import { describe, expect, it } from "vitest";

import { MockCommerceProductProvider } from "@/features/commerce/providers/mock-commerce-product-provider";

describe("MockCommerceProductProvider", () => {
  it("searches, filters, paginates, and returns range facets", async () => {
    const provider = new MockCommerceProductProvider();
    const response = await provider.search({
      facets: [{ field: "ec_brand", type: "regular", values: ["NexBot Vision"] }],
      page: 0,
      perPage: 2,
      query: "welding",
    });

    expect(response.products).toHaveLength(1);
    expect(response.products[0].brand).toBe("NexBot Vision");
    expect(response.facets.some((facet) => facet.type === "numericalRange" && facet.field === "ec_price")).toBe(true);
  });

  it("returns deterministic suggestions", async () => {
    const provider = new MockCommerceProductProvider();

    await expect(provider.getSuggestions("wel")).resolves.toEqual([
      { id: "commerce-suggestion-welding-arm", label: "welding arm", value: "welding arm" },
    ]);
  });
});
