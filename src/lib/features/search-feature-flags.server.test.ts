import { afterEach, describe, expect, it, vi } from "vitest";

import { getSearchFeatureFlags } from "@/lib/features/search-feature-flags.server";

describe("getSearchFeatureFlags", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("enables demo composition by default", () => {
    expect(getSearchFeatureFlags()).toEqual({
      enableFacets: true,
      enableInsightsRail: true,
      enablePopularContent: true,
      enableRelatedQueries: true,
      enableSampleSearchResponse: true,
      enableTopicInsight: true,
    });
  });

  it("treats only explicit truthy values as enabled when an env value is present", () => {
    vi.stubEnv("COVEO_FEATURE_SAMPLE_SEARCH_RESPONSE", "false");
    vi.stubEnv("COVEO_FEATURE_FACETS", "0");
    vi.stubEnv("COVEO_FEATURE_INSIGHTS_RAIL", "off");
    vi.stubEnv("COVEO_FEATURE_TOPIC_INSIGHT", "yes");
    vi.stubEnv("COVEO_FEATURE_RELATED_QUERIES", "1");
    vi.stubEnv("COVEO_FEATURE_POPULAR_CONTENT", "true");

    expect(getSearchFeatureFlags()).toEqual({
      enableFacets: false,
      enableInsightsRail: false,
      enablePopularContent: true,
      enableRelatedQueries: true,
      enableSampleSearchResponse: false,
      enableTopicInsight: true,
    });
  });
});
