import { afterEach, describe, expect, it, vi } from "vitest";

import { getSearchFeatureFlags } from "@/lib/features/search-feature-flags.server";

describe("getSearchFeatureFlags", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("resolves the live product-discovery flags by default", () => {
    expect(getSearchFeatureFlags()).toEqual({
      enableAnalytics: true,
      enableFacets: true,
      enableGenerativeAnswers: false,
      enableGenerativeCitations: true,
      enableGenerativeDisclaimer: true,
      enableGenerativeFeedback: true,
      enableGenerativeStreaming: false,
      enableInsightsRail: true,
      enablePopularContent: true,
      enableRelatedQueries: true,
      enableTopicInsight: true,
      enableTrendingContent: true,
    });
  });

  it("applies strict env booleans", () => {
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
      enableTopicInsight: true,
      enableTrendingContent: false,
    });
  });
});
