import type { FeatureFlagOverrides } from "@/features/feature-flags/feature-flags";

export type BooleanParseResult =
  | { ok: true; value: boolean }
  | { ok: false; reason: "empty" | "invalid"; value: undefined };

export function parseStrictBoolean(value: string | undefined): BooleanParseResult {
  if (value === undefined || value.trim() === "") {
    return { ok: false, reason: "empty", value: undefined };
  }

  const normalized = value.trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return { ok: true, value: true };
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return { ok: true, value: false };
  }

  return { ok: false, reason: "invalid", value: undefined };
}

export function readBooleanOverride(
  environment: Record<string, string | undefined>,
  key: string,
): boolean | undefined {
  const parsed = parseStrictBoolean(environment[key]);
  return parsed.ok ? parsed.value : undefined;
}

export function getEnvironmentFeatureFlagOverrides(
  environment: Record<string, string | undefined>,
): FeatureFlagOverrides {
  return {
    analytics: {
      enabled: readBooleanOverride(environment, "COVEO_FEATURE_ANALYTICS"),
      featureExposure: readBooleanOverride(environment, "COVEO_FEATURE_ANALYTICS_EXPOSURE"),
    },
    demo: {
      sampleSearchResponse: readBooleanOverride(environment, "COVEO_FEATURE_SAMPLE_SEARCH_RESPONSE"),
    },
    facets: {
      contentType: readBooleanOverride(environment, "COVEO_FEATURE_FACET_CONTENT_TYPE"),
      enabled: readBooleanOverride(environment, "COVEO_FEATURE_FACETS"),
      product: readBooleanOverride(environment, "COVEO_FEATURE_FACET_PRODUCT"),
      source: readBooleanOverride(environment, "COVEO_FEATURE_FACET_SOURCE"),
      updatedDate: readBooleanOverride(environment, "COVEO_FEATURE_FACET_UPDATED_DATE"),
    },
    generative: {
      citations: readBooleanOverride(environment, "COVEO_FEATURE_GENERATIVE_CITATIONS"),
      disclaimer: readBooleanOverride(environment, "COVEO_FEATURE_GENERATIVE_DISCLAIMER"),
      enabled: readBooleanOverride(environment, "COVEO_FEATURE_GENERATIVE_ENABLED"),
      feedback: readBooleanOverride(environment, "COVEO_FEATURE_GENERATIVE_FEEDBACK"),
      streaming: readBooleanOverride(environment, "COVEO_FEATURE_GENERATIVE_STREAMING"),
    },
    insights: {
      enabled: readBooleanOverride(environment, "COVEO_FEATURE_INSIGHTS_RAIL"),
      popularContent: readBooleanOverride(environment, "COVEO_FEATURE_POPULAR_CONTENT"),
      relatedQueries: readBooleanOverride(environment, "COVEO_FEATURE_RELATED_QUERIES"),
      topic: readBooleanOverride(environment, "COVEO_FEATURE_TOPIC_INSIGHT"),
    },
    results: {
      badges: readBooleanOverride(environment, "COVEO_FEATURE_RESULT_BADGES"),
      quickView: readBooleanOverride(environment, "COVEO_FEATURE_RESULT_QUICK_VIEW"),
      thumbnails: readBooleanOverride(environment, "COVEO_FEATURE_RESULT_THUMBNAILS"),
    },
    search: {
      querySuggestions: readBooleanOverride(environment, "COVEO_FEATURE_QUERY_SUGGESTIONS"),
      recentSearches: readBooleanOverride(environment, "COVEO_FEATURE_RECENT_SEARCHES"),
    },
    trending: {
      enabled: readBooleanOverride(environment, "COVEO_FEATURE_TRENDING_ENABLED"),
    },
  };
}
