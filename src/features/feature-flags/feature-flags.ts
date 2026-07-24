export interface FeatureFlags {
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
  analytics: {
    enabled: boolean;
  };
}

export type FeatureFlagOverrides = {
  [K in keyof FeatureFlags]?: Partial<FeatureFlags[K]>;
};

export const defaultFeatureFlags: Readonly<FeatureFlags> = Object.freeze({
  analytics: Object.freeze({
    enabled: true,
  }),
  generative: Object.freeze({
    citations: true,
    disclaimer: true,
    enabled: false,
    feedback: true,
    streaming: false,
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
      generative: { ...current.generative, ...pickBooleanOverrides(override.generative) },
      trending: { ...current.trending, ...pickBooleanOverrides(override.trending) },
    };
  }, cloneFeatureFlags(base));
}

export function resolveFeatureFlags({
  defaults,
  environment,
}: {
  defaults: FeatureFlags;
  environment?: FeatureFlagOverrides;
}) {
  return mergeFeatureFlags(defaults, environment);
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
    generative: { ...flags.generative },
    trending: { ...flags.trending },
  };
}
