export interface FeatureFlags {
  search: {
    querySuggestions: boolean;
    recentSearches: boolean;
  };
  results: {
    badges: boolean;
    thumbnails: boolean;
    quickView: boolean;
  };
  facets: {
    enabled: boolean;
    contentType: boolean;
    source: boolean;
    product: boolean;
    updatedDate: boolean;
  };
  generative: {
    enabled: boolean;
    streaming: boolean;
    citations: boolean;
    feedback: boolean;
    disclaimer: boolean;
  };
  trending: {
    enabled: boolean;
  };
  insights: {
    enabled: boolean;
    topic: boolean;
    relatedQueries: boolean;
    popularContent: boolean;
  };
  analytics: {
    enabled: boolean;
    featureExposure: boolean;
  };
  demo: {
    sampleSearchResponse: boolean;
  };
}

export type FeatureFlagOverrides = {
  [K in keyof FeatureFlags]?: Partial<FeatureFlags[K]>;
};

export const defaultFeatureFlags: Readonly<FeatureFlags> = Object.freeze({
  analytics: Object.freeze({
    enabled: true,
    featureExposure: true,
  }),
  demo: Object.freeze({
    sampleSearchResponse: false,
  }),
  facets: Object.freeze({
    contentType: true,
    enabled: true,
    product: true,
    source: true,
    updatedDate: false,
  }),
  generative: Object.freeze({
    citations: true,
    disclaimer: true,
    enabled: false,
    feedback: true,
    streaming: false,
  }),
  insights: Object.freeze({
    enabled: true,
    popularContent: true,
    relatedQueries: true,
    topic: true,
  }),
  results: Object.freeze({
    badges: true,
    quickView: false,
    thumbnails: true,
  }),
  search: Object.freeze({
    querySuggestions: true,
    recentSearches: false,
  }),
  trending: Object.freeze({
    enabled: true,
  }),
});

export function mergeFeatureFlags(
  base: FeatureFlags,
  ...overrides: Array<FeatureFlagOverrides | undefined>
): FeatureFlags {
  return overrides.reduce<FeatureFlags>((current, override) => {
    if (!override) {
      return current;
    }

    return {
      analytics: { ...current.analytics, ...pickBooleanOverrides(override.analytics) },
      demo: { ...current.demo, ...pickBooleanOverrides(override.demo) },
      facets: { ...current.facets, ...pickBooleanOverrides(override.facets) },
      generative: { ...current.generative, ...pickBooleanOverrides(override.generative) },
      insights: { ...current.insights, ...pickBooleanOverrides(override.insights) },
      results: { ...current.results, ...pickBooleanOverrides(override.results) },
      search: { ...current.search, ...pickBooleanOverrides(override.search) },
      trending: { ...current.trending, ...pickBooleanOverrides(override.trending) },
    };
  }, cloneFeatureFlags(base));
}

export function resolveFeatureFlags({
  defaults,
  developmentOverrides,
  environment,
  profile,
}: {
  defaults: FeatureFlags;
  environment?: FeatureFlagOverrides;
  profile?: FeatureFlagOverrides;
  developmentOverrides?: FeatureFlagOverrides;
}) {
  return mergeFeatureFlags(defaults, environment, profile, developmentOverrides);
}

function pickBooleanOverrides<T extends Record<string, boolean>>(input: Partial<T> | undefined) {
  if (!input) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(input).filter((entry): entry is [string, boolean] => typeof entry[1] === "boolean"),
  ) as Partial<T>;
}

function cloneFeatureFlags(flags: FeatureFlags): FeatureFlags {
  return {
    analytics: { ...flags.analytics },
    demo: { ...flags.demo },
    facets: { ...flags.facets },
    generative: { ...flags.generative },
    insights: { ...flags.insights },
    results: { ...flags.results },
    search: { ...flags.search },
    trending: { ...flags.trending },
  };
}
