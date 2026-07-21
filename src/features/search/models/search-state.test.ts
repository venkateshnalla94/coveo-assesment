import { describe, expect, it } from "vitest";

import type { SearchQuery, SearchResponse } from "@/features/search/models/search-models";
import { searchStateReducer } from "@/features/search/models/search-state";

const query: SearchQuery = {
  filters: {},
  page: 1,
  pageSize: 4,
  query: "digital",
  sort: "relevance",
};

describe("searchStateReducer", () => {
  it("moves from initial to loading to success", () => {
    const response: SearchResponse = {
      facets: [],
      results: [
        {
          description: "Description",
          id: "result-1",
          title: "Result",
          type: "article",
          url: "https://example.test",
        },
      ],
      totalCount: 1,
    };

    const loadingState = searchStateReducer({ query, status: "initial" }, {
      query,
      type: "search-requested",
    });
    const successState = searchStateReducer(loadingState, {
      response,
      type: "search-succeeded",
    });

    expect(loadingState.status).toBe("loading");
    expect(successState).toMatchObject({ response, status: "success" });
  });

  it("uses empty for successful searches without results", () => {
    const state = searchStateReducer({ query, status: "loading" }, {
      response: { facets: [], results: [], totalCount: 0 },
      type: "search-succeeded",
    });

    expect(state.status).toBe("empty");
  });

  it("preserves previous responses after failed searches", () => {
    const response: SearchResponse = { facets: [], results: [], totalCount: 0 };
    const state = searchStateReducer({ query, response, status: "success" }, {
      error: "Provider failed",
      type: "search-failed",
    });

    expect(state).toMatchObject({
      error: "Provider failed",
      previousResponse: response,
      status: "error",
    });
  });
});
