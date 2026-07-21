import { describe, expect, it } from "vitest";

import { MockTrendingProvider } from "@/features/trending/providers/mock-trending-provider";

describe("MockTrendingProvider", () => {
  it("returns deterministic ranked fixture content", async () => {
    const items = await new MockTrendingProvider().getTrendingContent();

    expect(items.map((item) => item.rank)).toEqual([1, 2, 3]);
    expect(items[0]).toMatchObject({ reason: "Most viewed fixture article" });
  });
});
