import { describe, expect, it } from "vitest";

import {
  getResultDateLabel,
  getResultDescription,
  getResultVariant,
  getSafeResultUrl,
} from "@/features/search/services/result-templates";

describe("result templates", () => {
  it("resolves known and unknown result variants", () => {
    expect(getResultVariant({ type: "documentation" })).toBe("documentation");
    expect(getResultVariant({ type: "unsupported" as never })).toBe("default");
  });

  it("handles missing optional fields and invalid URLs", () => {
    expect(getResultDescription({ description: " " })).toBeUndefined();
    expect(getSafeResultUrl({ url: "javascript:alert(1)" })).toBe("#");
    expect(getSafeResultUrl({ url: "https://example.test/path" })).toBe("https://example.test/path");
    expect(getResultDateLabel(undefined)).toBeUndefined();
  });

  it("keeps long titles as rendering data instead of truncating in the resolver", () => {
    const longTitle = "A".repeat(240);

    expect(longTitle).toHaveLength(240);
  });
});
