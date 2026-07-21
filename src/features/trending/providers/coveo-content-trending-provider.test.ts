import { afterEach, describe, expect, it, vi } from "vitest";

import { CoveoContentTrendingProvider } from "@/features/trending/providers/coveo-content-trending-provider";

describe("CoveoContentTrendingProvider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads technical resources through the internal server route", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [{ id: "r1", rank: 1, title: "Welding robotics guide", url: "https://example.test/guide" }],
        }),
        { headers: { "Content-Type": "application/json" }, status: 200 },
      ),
    );

    const provider = new CoveoContentTrendingProvider("welding arm");

    await expect(provider.getTrendingContent()).resolves.toEqual([
      { id: "r1", rank: 1, title: "Welding robotics guide", url: "https://example.test/guide" },
    ]);
    expect(fetch).toHaveBeenCalledWith(
      "/api/coveo/content/search",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("throws when technical resources fail", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 502 }));

    await expect(new CoveoContentTrendingProvider("welding arm").getTrendingContent()).rejects.toThrow(
      "Technical resources could not be loaded",
    );
  });
});
