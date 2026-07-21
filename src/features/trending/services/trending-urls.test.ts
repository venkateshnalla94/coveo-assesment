import { describe, expect, it } from "vitest";

import { getSafeTrendingUrl } from "@/features/trending/services/trending-urls";

describe("getSafeTrendingUrl", () => {
  it("rejects invalid trending urls", () => {
    expect(getSafeTrendingUrl({ url: "https://example.test/content" })).toBe(
      "https://example.test/content",
    );
    expect(getSafeTrendingUrl({ url: "ftp://example.test/content" })).toBe("#");
  });
});
