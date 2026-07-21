import { describe, expect, it } from "vitest";

import {
  coveoGenerativeCapabilities,
  coveoHeadlessCapabilities,
  inMemorySearchCapabilities,
  supportsSort,
} from "./provider-capabilities";

describe("provider capabilities", () => {
  it("declares sample and live search differences explicitly", () => {
    expect(supportsSort(inMemorySearchCapabilities, "most-popular")).toBe(true);
    expect(supportsSort(coveoHeadlessCapabilities, "most-popular")).toBe(false);
    expect(coveoHeadlessCapabilities.sorting).toEqual(["relevance"]);
  });

  it("keeps live generative unavailable until confirmed", () => {
    expect(coveoGenerativeCapabilities.available).toBe(false);
  });
});
