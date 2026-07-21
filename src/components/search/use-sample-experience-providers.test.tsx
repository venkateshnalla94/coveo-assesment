import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useSampleExperienceProviders } from "@/components/search/use-sample-experience-providers";
import { profileFixtures } from "@/features/demo-profiles/profile-fixtures";

describe("useSampleExperienceProviders", () => {
  it("constructs profile-backed sample providers", async () => {
    const fixtures = profileFixtures["developer-documentation"];
    const { result } = renderHook(() =>
      useSampleExperienceProviders({
        generativeFixture: fixtures.generativeAnswer,
        scenario: "default",
        searchResponse: fixtures.searchResponse,
        suggestedQueries: fixtures.suggestedQueries,
        trendingItems: fixtures.trendingItems,
      }),
    );

    await expect(result.current.searchProvider.getSuggestions("auth")).resolves.toContainEqual({
      id: "suggestion-authentication",
      label: "authentication",
      value: "authentication",
    });
    await expect(result.current.generativeProvider.generate("authentication")).resolves.toMatchObject({
      answer: expect.stringContaining("short-lived token"),
    });
    await expect(result.current.trendingProvider.getTrendingContent()).resolves.toHaveLength(3);
  });

  it("honors empty and error scenarios for optional providers", async () => {
    const fixtures = profileFixtures["developer-documentation"];
    const emptyTrending = renderHook(() =>
      useSampleExperienceProviders({
        scenario: "trending-empty",
        searchResponse: fixtures.searchResponse,
      }),
    );
    const failingTrending = renderHook(() =>
      useSampleExperienceProviders({
        scenario: "trending-error",
        searchResponse: fixtures.searchResponse,
      }),
    );

    await expect(emptyTrending.result.current.trendingProvider.getTrendingContent()).resolves.toEqual([]);
    await expect(failingTrending.result.current.trendingProvider.getTrendingContent()).rejects.toThrow(
      "Trending scenario failed",
    );
  });

  it("honors generative scenario behavior", async () => {
    const fixtures = profileFixtures["developer-documentation"];
    const failingGenerative = renderHook(() =>
      useSampleExperienceProviders({
        scenario: "generative-error",
        searchResponse: fixtures.searchResponse,
      }),
    );
    const noAnswerGenerative = renderHook(() =>
      useSampleExperienceProviders({
        scenario: "generative-no-answer",
        searchResponse: fixtures.searchResponse,
      }),
    );

    await expect(failingGenerative.result.current.generativeProvider.generate("authentication")).rejects.toThrow(
      "Mock generative provider failed",
    );
    await expect(noAnswerGenerative.result.current.generativeProvider.generate("authentication")).resolves.toBeNull();
  });
});
