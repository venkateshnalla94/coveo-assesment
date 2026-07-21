import { describe, expect, it } from "vitest";

import { getPaginationState } from "@/features/search/services/pagination";

describe("getPaginationState", () => {
  it("calculates boundaries and result ranges", () => {
    expect(getPaginationState({ page: 2, pageSize: 4, totalCount: 10 })).toEqual({
      currentPage: 2,
      firstResult: 5,
      lastResult: 8,
      pageSize: 4,
      totalCount: 10,
      totalPages: 3,
    });
  });

  it("clamps invalid pages and empty totals", () => {
    expect(getPaginationState({ page: 99, pageSize: 4, totalCount: 0 })).toMatchObject({
      currentPage: 1,
      firstResult: 0,
      lastResult: 0,
      totalPages: 1,
    });
  });
});
