import { afterEach, describe, expect, it, vi } from "vitest";

import { CoveoCommerceProductProvider } from "@/features/commerce/providers/coveo-commerce-product-provider";

describe("CoveoCommerceProductProvider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("gets live suggestions through the internal server route", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          suggestions: [{ id: "s1", label: "welding arm", value: "welding arm" }],
        }),
        { headers: { "Content-Type": "application/json" }, status: 200 },
      ),
    );

    await expect(new CoveoCommerceProductProvider().getSuggestions("wel")).resolves.toEqual([
      { id: "s1", label: "welding arm", value: "welding arm" },
    ]);

    expect(fetch).toHaveBeenCalledWith(
      "/api/coveo/commerce/suggestions",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("returns no suggestions when the server route fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 502 }));

    await expect(new CoveoCommerceProductProvider().getSuggestions("wel")).resolves.toEqual([]);
  });
});
