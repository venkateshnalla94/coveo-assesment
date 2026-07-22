import {
  defaultFeatureFlags,
  resolveFeatureFlags,
  type FeatureFlags,
} from "@/features/feature-flags/feature-flags";
import { getEnvironmentFeatureFlagOverrides } from "@/features/feature-flags/env-feature-flags";
import {
  isCoveoAuthMode,
  type CoveoAuthMode,
} from "@/features/commerce/headless/commerce-auth";

export type RuntimeEnvironment = "development" | "test" | "production";

export interface RuntimeConfig {
  environment: RuntimeEnvironment;
  featureFlags: FeatureFlags;
  coveo: {
    anonymousSearchApiKeyConfigured: boolean;
    authMode?: CoveoAuthMode;
    authenticatedSearchApiKeyConfigured: boolean;
    organizationId?: string;
    searchEndpoint?: string;
    tokenConfigured: boolean;
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
}: {
  environment?: Record<string, string | undefined>;
  searchParams?: Record<string, string | string[] | undefined>;
} = {}): RuntimeConfig {
  const runtimeEnvironment = normalizeEnvironment(environment.NODE_ENV);
  const authMode = resolveCoveoAuthMode(environment.COVEO_AUTH_MODE);
  const envOverrides = getEnvironmentFeatureFlagOverrides(environment);

  return {
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
    environment: runtimeEnvironment,
    featureFlags: resolveFeatureFlags({
      defaults: defaultFeatureFlags,
      environment: envOverrides,
    }),
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

function optional(value: string | undefined) {
  return value && value.trim().length > 0 ? value : undefined;
}

export const fallbackRuntimeConfig: RuntimeConfig = {
  coveo: {
    anonymousSearchApiKeyConfigured: false,
    authenticatedSearchApiKeyConfigured: false,
    tokenConfigured: false,
  },
  environment: "development",
  featureFlags: resolveFeatureFlags({
    defaults: defaultFeatureFlags,
  }),
};
