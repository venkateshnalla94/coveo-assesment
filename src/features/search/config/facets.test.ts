import { describe, expect, it } from "vitest";

import { getFacetLabel, getFacetOrder } from "@/features/search/config/facets";

describe("facet config", () => {
  it("returns configured labels, fallback labels, generated labels, and ordering", () => {
    expect(getFacetLabel("filetype")).toBe("Content Type");
    expect(getFacetLabel("custom_field", "Custom Label")).toBe("Custom Label");
    expect(getFacetLabel("@custom-field")).toBe("Custom Field");
    expect(getFacetOrder("source")).toBe(20);
    expect(getFacetOrder("unknown")).toBe(100);
  });
});
