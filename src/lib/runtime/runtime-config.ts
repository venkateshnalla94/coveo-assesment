import {
  DEFAULT_DEMO_PROFILE_ID,
  resolveDemoProfile,
  type DemoProfile,
} from "@/features/demo-profiles/demo-profiles";
import {
  DEFAULT_DEVELOPMENT_SCENARIO,
  resolveDevelopmentScenario,
  type DevelopmentScenario,
} from "@/features/development/scenarios";
import {
  defaultFeatureFlags,
  resolveFeatureFlags,
  type FeatureFlagOverrides,
  type FeatureFlags,
} from "@/features/feature-flags/feature-flags";
import { getEnvironmentFeatureFlagOverrides } from "@/features/feature-flags/env-feature-flags";
import {
  coveoGenerativeCapabilities,
  coveoHeadlessCapabilities,
  inMemorySearchCapabilities,
  mockGenerativeCapabilities,
  type GenerativeProviderCapabilities,
  type SearchProviderCapabilities,
} from "@/features/search/capabilities/provider-capabilities";
import {
  isCoveoAuthMode,
  type CoveoAuthMode,
} from "@/features/commerce/headless/commerce-auth";

export type RuntimeEnvironment = "development" | "test" | "production";
export type SearchProviderMode = "mock" | "coveo";

export interface RuntimeConfig {
  environment: RuntimeEnvironment;
  searchProvider: SearchProviderMode;
  demoProfile: DemoProfile;
  scenario: DevelopmentScenario;
  featureFlags: FeatureFlags;
  coveo: {
    anonymousSearchApiKeyConfigured: boolean;
    authMode?: CoveoAuthMode;
    authenticatedSearchApiKeyConfigured: boolean;
    organizationId?: string;
    searchEndpoint?: string;
    tokenConfigured: boolean;
  };
  capabilities: {
    search: SearchProviderCapabilities;
    generative: GenerativeProviderCapabilities;
  };
  development: {
    queryOverridesEnabled: boolean;
  };
}

export interface ServerOnlyRuntimeConfig {
  coveo: {
    authenticatedSearchApiKey?: string;
    platformApiKey?: string;
    searchTokenEndpoint?: string;
    userId: string;
    identityProvider: string;
  };
}

export function resolveRuntimeConfig({
  environment = process.env,
  searchParams,
}: {
  environment?: Record<string, string | undefined>;
  searchParams?: Record<string, string | string[] | undefined>;
} = {}): RuntimeConfig {
  const runtimeEnvironment = normalizeEnvironment(environment.NODE_ENV);
  const authMode = resolveCoveoAuthMode(environment.COVEO_AUTH_MODE);
  const envOverrides = getEnvironmentFeatureFlagOverrides(environment);
  const queryOverridesEnabled =
    runtimeEnvironment !== "production" &&
    (environment.COVEO_DEVELOPMENT_QUERY_OVERRIDES === "true" ||
      environment.NODE_ENV === "development");
  const queryProfile = queryOverridesEnabled
    ? firstValue(searchParams?.profile)
    : undefined;
  const profile = resolveDemoProfile(
    queryProfile ?? environment.NEXT_PUBLIC_DEMO_PROFILE,
  );
  const featureFlags = resolveFeatureFlags({
    defaults: {
      ...defaultFeatureFlags,
      demo: { ...defaultFeatureFlags.demo, sampleSearchResponse: true },
      generative: {
        ...defaultFeatureFlags.generative,
        enabled:
          envOverrides.generative?.enabled ??
          envOverrides.demo?.sampleSearchResponse ??
          true,
        streaming: envOverrides.generative?.streaming ?? true,
      },
    },
    environment: envOverrides,
    profile: profile.featureFlags,
    developmentOverrides: queryOverridesEnabled
      ? getQueryFeatureFlagOverrides(searchParams ?? {})
      : undefined,
  });
  const searchProvider: SearchProviderMode = featureFlags.demo
    .sampleSearchResponse
    ? "mock"
    : "coveo";

  return {
    capabilities: {
      generative:
        searchProvider === "mock"
          ? mockGenerativeCapabilities
          : coveoGenerativeCapabilities,
      search:
        searchProvider === "mock"
          ? inMemorySearchCapabilities
          : coveoHeadlessCapabilities,
    },
    coveo: {
      anonymousSearchApiKeyConfigured: Boolean(
        optional(environment.NEXT_PUBLIC_COVEO_ANONYMOUS_SEARCH_API_KEY),
      ),
      authMode,
      authenticatedSearchApiKeyConfigured: Boolean(
        optional(environment.COVEO_AUTHENTICATED_SEARCH_API_KEY),
      ),
      organizationId: optional(environment.COVEO_ORGANIZATION_ID),
      searchEndpoint: optional(environment.COVEO_SEARCH_TOKEN_ENDPOINT),
      tokenConfigured: Boolean(
        optional(environment.COVEO_ORGANIZATION_ID) &&
          authMode === "search-token" &&
          optional(environment.COVEO_AUTHENTICATED_SEARCH_API_KEY),
      ),
    },
    demoProfile: profile,
    development: {
      queryOverridesEnabled,
    },
    environment: runtimeEnvironment,
    featureFlags,
    scenario: resolveDevelopmentScenario({
      environment: runtimeEnvironment,
      queryValue: queryOverridesEnabled
        ? firstValue(searchParams?.scenario)
        : undefined,
    }),
    searchProvider,
  };
}

export function resolveServerOnlyRuntimeConfig(
  environment: Record<string, string | undefined> = process.env,
): ServerOnlyRuntimeConfig {
  return {
    coveo: {
      authenticatedSearchApiKey: optional(
        environment.COVEO_AUTHENTICATED_SEARCH_API_KEY,
      ),
      identityProvider:
        optional(environment.COVEO_IDENTITY_PROVIDER) ??
        "Email Security Provider",
      platformApiKey: optional(environment.COVEO_PLATFORM_API_KEY),
      searchTokenEndpoint: optional(environment.COVEO_SEARCH_TOKEN_ENDPOINT),
      userId: optional(environment.COVEO_USER_ID) ?? "anonymous",
    },
  };
}

export function normalizeEnvironment(
  value: string | undefined,
): RuntimeEnvironment {
  return value === "production" || value === "test" ? value : "development";
}

function resolveCoveoAuthMode(value: string | undefined): CoveoAuthMode | undefined {
  const normalized = optional(value);

  if (!normalized) {
    return undefined;
  }

  if (!isCoveoAuthMode(normalized)) {
    throw new Error(
      "COVEO_AUTH_MODE must be either anonymous-api-key or search-token.",
    );
  }

  return normalized;
}

function getQueryFeatureFlagOverrides(
  searchParams: Record<string, string | string[] | undefined>,
): FeatureFlagOverrides | undefined {
  const flags = firstValue(searchParams.flags);

  if (!flags) {
    return undefined;
  }

  const overrides: FeatureFlagOverrides = {};
  const enabled = new Set(
    flags
      .split(",")
      .map((flag) => flag.trim())
      .filter(Boolean),
  );

  if (enabled.has("generative")) {
    overrides.generative = { enabled: true };
  }

  if (enabled.has("no-generative")) {
    overrides.generative = { enabled: false };
  }

  if (enabled.has("trending")) {
    overrides.trending = { enabled: true };
  }

  if (enabled.has("no-trending")) {
    overrides.trending = { enabled: false };
  }

  if (enabled.has("live")) {
    overrides.demo = { sampleSearchResponse: false };
  }

  if (enabled.has("sample")) {
    overrides.demo = { sampleSearchResponse: true };
  }

  return Object.keys(overrides).length > 0 ? overrides : undefined;
}

function optional(value: string | undefined) {
  return value && value.trim().length > 0 ? value : undefined;
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export const fallbackRuntimeConfig: RuntimeConfig = {
  capabilities: {
    generative: mockGenerativeCapabilities,
    search: inMemorySearchCapabilities,
  },
  coveo: {
    anonymousSearchApiKeyConfigured: false,
    authenticatedSearchApiKeyConfigured: false,
    tokenConfigured: false,
  },
  demoProfile: resolveDemoProfile(DEFAULT_DEMO_PROFILE_ID),
  development: {
    queryOverridesEnabled: false,
  },
  environment: "development",
  featureFlags: resolveFeatureFlags({
    defaults: {
      ...defaultFeatureFlags,
      demo: { ...defaultFeatureFlags.demo, sampleSearchResponse: true },
      generative: {
        ...defaultFeatureFlags.generative,
        enabled: true,
        streaming: true,
      },
    },
  }),
  scenario: DEFAULT_DEVELOPMENT_SCENARIO,
  searchProvider: "mock",
};
