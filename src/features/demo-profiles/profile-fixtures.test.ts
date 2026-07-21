import { describe, expect, it } from "vitest";

import { profileFixtures } from "@/features/demo-profiles/profile-fixtures";

describe("profileFixtures", () => {
  it("provides distinct profile-specific search fixtures", () => {
    expect(profileFixtures["developer-documentation"].searchResponse.results[0]?.type).toBe("documentation");
    expect(profileFixtures["customer-support"].searchResponse.results[0]?.source).toBe("Knowledge Base");
    expect(profileFixtures.ecommerce.searchResponse.results[0]?.type).toBe("product");
    expect(profileFixtures.minimal.searchResponse.results).toHaveLength(3);
  });

  it("keeps minimal fixtures free of generative and trending data", () => {
    expect(profileFixtures.minimal.generativeAnswer).toBeUndefined();
    expect(profileFixtures.minimal.trendingItems).toEqual([]);
  });

  it("uses provider-consumable suggestions and facets", () => {
    expect(profileFixtures["developer-documentation"].suggestedQueries).toContain("authentication");
    expect(profileFixtures.ecommerce.searchResponse.facets.map((facet) => facet.field)).toEqual([
      "filetype",
      "source",
      "product",
    ]);
  });

  it("models branded commerce results without forcing brand metadata on every fixture", () => {
    expect(profileFixtures.ecommerce.searchResponse.results[0]?.badges).toEqual([
      "Northstar",
      "Apparel",
    ]);
    expect(profileFixtures["developer-documentation"].searchResponse.results[0]?.metadata?.brand).toBeNull();
  });
});
