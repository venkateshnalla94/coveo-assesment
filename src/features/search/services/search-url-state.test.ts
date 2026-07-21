import { describe, expect, it } from "vitest";

import {
  parseSearchUrlState,
  searchQueryFromUrlState,
  searchUrlStateFromQuery,
  serializeSearchUrlState,
} from "./search-url-state";

describe("search URL state", () => {
  it("parses and normalizes query, page, sort, facets, profile, and scenario", () => {
    const state = parseSearchUrlState(
      new URLSearchParams(
        "q=authentication&page=2&sort=newest&contentType=PDF&contentType=PDF&source=docs&profile=ecommerce&scenario=empty",
      ),
      { allowDevelopmentParameters: true },
    );

    expect(state).toEqual({
      filters: { filetype: ["PDF"], source: ["docs"] },
      page: 2,
      profile: "ecommerce",
      query: "authentication",
      scenario: "empty",
      sort: "newest",
    });
  });

  it("falls back for invalid state and ignores development params when disabled", () => {
    const state = parseSearchUrlState(
      new URLSearchParams("page=-3&sort=random&unknown=x&profile=ecommerce&scenario=error"),
    );

    expect(state).toEqual({
      filters: {},
      page: 1,
      profile: undefined,
      query: undefined,
      scenario: undefined,
      sort: "relevance",
    });
  });

  it("parses object-form URL state with duplicate array parameters", () => {
    expect(
      parseSearchUrlState({
        contentType: ["PDF", "PDF,HTML"],
        page: "2",
        q: " docs ",
        source: undefined,
      }),
    ).toMatchObject({
      filters: { filetype: ["HTML", "PDF"] },
      page: 2,
      query: "docs",
    });
  });

  it("serializes canonical state", () => {
    expect(
      serializeSearchUrlState(
        {
          filters: { filetype: ["PDF"], source: ["docs"] },
          page: 1,
          profile: "customer-support",
          query: "authentication",
          scenario: "generative-error",
          sort: "relevance",
        },
        { includeDevelopmentParameters: true },
      ),
    ).toBe(
      "q=authentication&contentType=PDF&source=docs&profile=customer-support&scenario=generative-error",
    );
  });

  it("round-trips search query state", () => {
    const query = searchQueryFromUrlState({
      filters: { product: ["Search"] },
      page: 3,
      query: "headless",
      sort: "most-popular",
    });

    expect(searchUrlStateFromQuery(query)).toMatchObject({
      filters: { product: ["Search"] },
      page: 3,
      query: "headless",
      sort: "most-popular",
    });
  });
});
