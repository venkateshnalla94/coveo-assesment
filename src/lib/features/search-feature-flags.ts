export type SearchFeatureFlags = {
  enableAnalytics: boolean;
  enableFacets: boolean;
  enableGenerativeAnswers: boolean;
  enableGenerativeCitations: boolean;
  enableGenerativeDisclaimer: boolean;
  enableGenerativeFeedback: boolean;
  enableGenerativeStreaming: boolean;
  enableInsightsRail: boolean;
  enablePopularContent: boolean;
  enableRelatedQueries: boolean;
  enableSampleSearchResponse: boolean;
  enableTopicInsight: boolean;
  enableTrendingContent: boolean;
};

export const defaultSearchFeatureFlags: SearchFeatureFlags = {
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
  enableSampleSearchResponse: false,
  enableTopicInsight: true,
  enableTrendingContent: true,
};
