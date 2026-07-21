import type { SearchFeatureFlags } from "@/lib/features/search-feature-flags";

function readBooleanFlag(value: string | undefined, defaultValue: boolean) {
  if (value === undefined || value.trim() === "") {
    return defaultValue;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

export function getSearchFeatureFlags(): SearchFeatureFlags {
  return {
    enableFacets: readBooleanFlag(process.env.COVEO_FEATURE_FACETS, true),
    enableInsightsRail: readBooleanFlag(process.env.COVEO_FEATURE_INSIGHTS_RAIL, true),
    enablePopularContent: readBooleanFlag(process.env.COVEO_FEATURE_POPULAR_CONTENT, true),
    enableRelatedQueries: readBooleanFlag(process.env.COVEO_FEATURE_RELATED_QUERIES, true),
    enableSampleSearchResponse: readBooleanFlag(
      process.env.COVEO_FEATURE_SAMPLE_SEARCH_RESPONSE,
      true,
    ),
    enableTopicInsight: readBooleanFlag(process.env.COVEO_FEATURE_TOPIC_INSIGHT, true),
  };
}
