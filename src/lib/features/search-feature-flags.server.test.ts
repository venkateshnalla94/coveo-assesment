import { afterEach, describe, expect, it, vi } from "vitest";

import { getSearchFeatureFlags } from "@/lib/features/search-feature-flags.server";

describe("getSearchFeatureFlags", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("enables demo composition by default", () => {
    expect(getSearchFeatureFlags()).toEqual({
      enableAnalytics: true,
      enableFacets: true,
      enableGenerativeAnswers: true,
      enableGenerativeCitations: true,
      enableGenerativeDisclaimer: true,
      enableGenerativeFeedback: true,
      enableGenerativeStreaming: false,
      enableInsightsRail: true,
      enablePopularContent: true,
      enableRelatedQueries: true,
      enableSampleSearchResponse: true,
      enableTopicInsight: true,
      enableTrendingContent: true,
    });
  });

  it("treats only explicit truthy values as enabled when an env value is present", () => {
    vi.stubEnv("COVEO_FEATURE_SAMPLE_SEARCH_RESPONSE", "false");
    vi.stubEnv("COVEO_FEATURE_FACETS", "0");
    vi.stubEnv("COVEO_FEATURE_INSIGHTS_RAIL", "off");
    vi.stubEnv("COVEO_FEATURE_TOPIC_INSIGHT", "yes");
    vi.stubEnv("COVEO_FEATURE_RELATED_QUERIES", "1");
    vi.stubEnv("COVEO_FEATURE_POPULAR_CONTENT", "true");
    vi.stubEnv("COVEO_FEATURE_ANALYTICS", "false");
    vi.stubEnv("COVEO_FEATURE_GENERATIVE_ENABLED", "true");
    vi.stubEnv("COVEO_FEATURE_GENERATIVE_CITATIONS", "false");
    vi.stubEnv("COVEO_FEATURE_GENERATIVE_DISCLAIMER", "0");
    vi.stubEnv("COVEO_FEATURE_GENERATIVE_FEEDBACK", "on");
    vi.stubEnv("COVEO_FEATURE_GENERATIVE_STREAMING", "yes");
    vi.stubEnv("COVEO_FEATURE_TRENDING_ENABLED", "false");

    expect(getSearchFeatureFlags()).toEqual({
      enableAnalytics: false,
      enableFacets: false,
      enableGenerativeAnswers: true,
      enableGenerativeCitations: false,
      enableGenerativeDisclaimer: false,
      enableGenerativeFeedback: true,
      enableGenerativeStreaming: true,
      enableInsightsRail: false,
      enablePopularContent: true,
      enableRelatedQueries: true,
      enableSampleSearchResponse: false,
      enableTopicInsight: true,
      enableTrendingContent: false,
    });
  });
});
