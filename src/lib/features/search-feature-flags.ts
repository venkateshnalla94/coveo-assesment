export type SearchFeatureFlags = {
  enableFacets: boolean;
  enableInsightsRail: boolean;
  enablePopularContent: boolean;
  enableRelatedQueries: boolean;
  enableSampleSearchResponse: boolean;
  enableTopicInsight: boolean;
};

export const defaultSearchFeatureFlags: SearchFeatureFlags = {
  enableFacets: true,
  enableInsightsRail: true,
  enablePopularContent: true,
  enableRelatedQueries: true,
  enableSampleSearchResponse: false,
  enableTopicInsight: true,
};
