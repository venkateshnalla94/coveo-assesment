import type { FeatureFlags } from "@/features/feature-flags/feature-flags";

export type SearchFeatureFlags = {
  enableAnalytics: boolean;
  enableGenerativeAnswers: boolean;
  enableGenerativeCitations: boolean;
  enableGenerativeDisclaimer: boolean;
  enableGenerativeFeedback: boolean;
  enableGenerativeStreaming: boolean;
  enableTrendingContent: boolean;
};

export const defaultSearchFeatureFlags: SearchFeatureFlags = {
  enableAnalytics: true,
  enableGenerativeAnswers: false,
  enableGenerativeCitations: true,
  enableGenerativeDisclaimer: true,
  enableGenerativeFeedback: true,
  enableGenerativeStreaming: false,
  enableTrendingContent: true,
};

export function toSearchFeatureFlags(flags: FeatureFlags): SearchFeatureFlags {
  return {
    enableAnalytics: flags.analytics.enabled,
    enableGenerativeAnswers: flags.generative.enabled,
    enableGenerativeCitations: flags.generative.citations,
    enableGenerativeDisclaimer: flags.generative.disclaimer,
    enableGenerativeFeedback: flags.generative.feedback,
    enableGenerativeStreaming: flags.generative.streaming,
    enableTrendingContent: flags.trending.enabled,
  };
}
