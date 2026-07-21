"use client";

import { useMemo } from "react";

import type { GenerativeAnswer } from "@/features/generative/models/generative-models";
import { InMemoryFeedbackProvider } from "@/features/generative/providers/feedback-provider";
import { MockGenerativeProvider } from "@/features/generative/providers/mock-generative-provider";
import type { DevelopmentScenario } from "@/features/development/scenarios";
import type { SearchResponse } from "@/features/search/models/search-models";
import { InMemorySearchProvider } from "@/features/search/providers/in-memory-search-provider";
import type { TrendingItem } from "@/features/trending/models/trending-models";
import { MockTrendingProvider } from "@/features/trending/providers/mock-trending-provider";
import type { TrendingProvider } from "@/features/trending/providers/trending-provider";

export function useSampleExperienceProviders({
  generativeFixture,
  scenario,
  searchResponse,
  suggestedQueries,
  trendingItems,
}: {
  generativeFixture?: Omit<GenerativeAnswer, "id" | "query">;
  scenario: DevelopmentScenario;
  searchResponse: SearchResponse;
  suggestedQueries?: string[];
  trendingItems?: TrendingItem[];
}) {
  const searchProvider = useMemo(
    () => new InMemorySearchProvider(searchResponse, { suggestedQueries }),
    [searchResponse, suggestedQueries],
  );
  const generativeProvider = useMemo(
    () =>
      new MockGenerativeProvider({
        answer: generativeFixture,
        behavior:
          scenario === "generative-error"
            ? "error"
            : scenario === "generative-no-answer"
              ? "no-answer"
              : scenario === "loading" || scenario === "generative"
                ? "delayed-answer"
                : undefined,
        delayMs: scenario === "loading" ? 10000 : undefined,
      }),
    [generativeFixture, scenario],
  );
  const feedbackProvider = useMemo(() => new InMemoryFeedbackProvider(), []);
  const trendingProvider = useMemo<TrendingProvider>(() => {
    if (scenario === "trending-empty") {
      return new MockTrendingProvider([]);
    }

    if (scenario === "trending-error") {
      return { getTrendingContent: async () => Promise.reject(new Error("Trending scenario failed.")) };
    }

    return new MockTrendingProvider(trendingItems);
  }, [scenario, trendingItems]);

  return {
    feedbackProvider,
    generativeProvider,
    searchProvider,
    trendingProvider,
  };
}
