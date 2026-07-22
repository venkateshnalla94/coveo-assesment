import type { FeatureFlags } from "@/features/feature-flags/feature-flags";

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
  enableTopicInsight: true,
  enableTrendingContent: true,
};

export function toSearchFeatureFlags(flags: FeatureFlags): SearchFeatureFlags {
  return {
    enableAnalytics: flags.analytics.enabled,
    enableFacets: flags.facets.enabled,
    enableGenerativeAnswers: flags.generative.enabled,
    enableGenerativeCitations: flags.generative.citations,
    enableGenerativeDisclaimer: flags.generative.disclaimer,
    enableGenerativeFeedback: flags.generative.feedback,
    enableGenerativeStreaming: flags.generative.streaming,
    enableInsightsRail: flags.insights.enabled,
    enablePopularContent: flags.insights.popularContent,
    enableRelatedQueries: flags.insights.relatedQueries,
    enableTopicInsight: flags.insights.topic,
    enableTrendingContent: flags.trending.enabled,
  };
}

export function fromSearchFeatureFlags(flags: SearchFeatureFlags): FeatureFlags {
  return {
    analytics: {
      enabled: flags.enableAnalytics,
      featureExposure: true,
    },
    facets: {
      contentType: flags.enableFacets,
      enabled: flags.enableFacets,
      product: flags.enableFacets,
      source: flags.enableFacets,
      updatedDate: false,
    },
    generative: {
      citations: flags.enableGenerativeCitations,
      disclaimer: flags.enableGenerativeDisclaimer,
      enabled: flags.enableGenerativeAnswers,
      feedback: flags.enableGenerativeFeedback,
      streaming: flags.enableGenerativeStreaming,
    },
    insights: {
      enabled: flags.enableInsightsRail,
      popularContent: flags.enablePopularContent,
      relatedQueries: flags.enableRelatedQueries,
      topic: flags.enableTopicInsight,
    },
    results: {
      badges: true,
      quickView: false,
      thumbnails: true,
    },
    search: {
      querySuggestions: true,
      recentSearches: false,
    },
    trending: {
      enabled: flags.enableTrendingContent,
    },
  };
}
