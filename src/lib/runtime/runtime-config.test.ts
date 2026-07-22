import { describe, expect, it } from "vitest";

import {
  fallbackRuntimeConfig,
  normalizeEnvironment,
  resolveRuntimeConfig,
  resolveServerOnlyRuntimeConfig,
} from "./runtime-config";

describe("runtime config", () => {
  it("resolves public runtime config without serializing secrets", () => {
    const config = resolveRuntimeConfig({
      environment: {
        COVEO_AUTH_MODE: "search-token",
        COVEO_AUTHENTICATED_SEARCH_API_KEY: "private-token-minting-key",
        COVEO_ORGANIZATION_ID: "org",
        COVEO_PLATFORM_API_KEY: "secret",
        COVEO_FEATURE_SAMPLE_SEARCH_RESPONSE: "false",
        NEXT_PUBLIC_DEMO_PROFILE: "minimal",
        NODE_ENV: "production",
      },
      searchParams: { profile: "ecommerce", scenario: "error" },
    });

    expect(config.environment).toBe("production");
    expect(config.demoProfile.id).toBe("minimal");
    expect(config.scenario).toBe("default");
    expect(config.searchProvider).toBe("coveo");
    expect(config.coveo.authMode).toBe("search-token");
    expect(config.coveo.tokenConfigured).toBe(true);
    expect(JSON.stringify(config)).not.toContain("secret");
    expect(JSON.stringify(config)).not.toContain("private-token-minting-key");
  });

  it("resolves anonymous API key mode only from the explicit public variable", () => {
    const config = resolveRuntimeConfig({
      environment: {
        COVEO_AUTH_MODE: "anonymous-api-key",
        COVEO_ORGANIZATION_ID: "org",
        COVEO_PLATFORM_API_KEY: "server-only-key",
        NEXT_PUBLIC_COVEO_ANONYMOUS_SEARCH_API_KEY: "public-anonymous-key",
        NODE_ENV: "production",
      },
    });

    expect(config.coveo.authMode).toBe("anonymous-api-key");
    expect(config.coveo.anonymousSearchApiKeyConfigured).toBe(true);
    expect(config.coveo.authenticatedSearchApiKeyConfigured).toBe(false);
    expect(config.coveo.tokenConfigured).toBe(false);
    expect(JSON.stringify(config)).not.toContain("server-only-key");
    expect(JSON.stringify(config)).not.toContain("public-anonymous-key");
  });

  it("rejects invalid Coveo auth modes", () => {
    expect(() =>
      resolveRuntimeConfig({
        environment: {
          COVEO_AUTH_MODE: "platform-key",
          NODE_ENV: "production",
        },
      }),
    ).toThrow("COVEO_AUTH_MODE must be either anonymous-api-key or search-token.");
  });

  it("allows development profile and scenario query overrides", () => {
    const config = resolveRuntimeConfig({
      environment: {
        COVEO_DEVELOPMENT_QUERY_OVERRIDES: "true",
        NODE_ENV: "development",
        NEXT_PUBLIC_DEMO_PROFILE: "minimal",
      },
      searchParams: { profile: "ecommerce", scenario: "trending-error" },
    });

    expect(config.demoProfile.id).toBe("ecommerce");
    expect(config.scenario).toBe("trending-error");
  });

  it("applies development feature query overrides when enabled", () => {
    const config = resolveRuntimeConfig({
      environment: {
        COVEO_DEVELOPMENT_QUERY_OVERRIDES: "true",
        NODE_ENV: "test",
      },
      searchParams: { flags: "no-generative,no-trending" },
    });

    expect(config.featureFlags.generative.enabled).toBe(false);
    expect(config.featureFlags.trending.enabled).toBe(false);
  });

  it("ignores unknown query flag overrides", () => {
    const config = resolveRuntimeConfig({
      environment: {
        COVEO_DEVELOPMENT_QUERY_OVERRIDES: "true",
        NODE_ENV: "test",
      },
      searchParams: { flags: "unknown" },
    });

    expect(config.featureFlags.trending.enabled).toBe(true);
  });

  it("supports explicit positive development feature overrides", () => {
    const config = resolveRuntimeConfig({
      environment: {
        COVEO_DEVELOPMENT_QUERY_OVERRIDES: "true",
        COVEO_FEATURE_GENERATIVE_ENABLED: "false",
        COVEO_FEATURE_TRENDING_ENABLED: "false",
        NODE_ENV: "test",
      },
      searchParams: { flags: "generative,trending" },
    });

    expect(config.featureFlags.generative.enabled).toBe(true);
    expect(config.featureFlags.trending.enabled).toBe(true);
  });

  it("allows development-only sample/live provider overrides", () => {
    const liveConfig = resolveRuntimeConfig({
      environment: {
        COVEO_DEVELOPMENT_QUERY_OVERRIDES: "true",
        NODE_ENV: "test",
      },
      searchParams: { flags: "live" },
    });
    const sampleConfig = resolveRuntimeConfig({
      environment: {
        COVEO_DEVELOPMENT_QUERY_OVERRIDES: "true",
        COVEO_FEATURE_SAMPLE_SEARCH_RESPONSE: "false",
        NODE_ENV: "test",
      },
      searchParams: { flags: "sample" },
    });

    expect(liveConfig.searchProvider).toBe("coveo");
    expect(sampleConfig.searchProvider).toBe("mock");
  });

  it("rejects development query overrides in production", () => {
    const config = resolveRuntimeConfig({
      environment: {
        COVEO_DEVELOPMENT_QUERY_OVERRIDES: "true",
        COVEO_FEATURE_SAMPLE_SEARCH_RESPONSE: "true",
        NEXT_PUBLIC_DEMO_PROFILE: "developer-documentation",
        NODE_ENV: "production",
      },
      searchParams: { flags: "live,no-generative", profile: "ecommerce", scenario: "error" },
    });

    expect(config.demoProfile.id).toBe("developer-documentation");
    expect(config.scenario).toBe("default");
    expect(config.searchProvider).toBe("mock");
    expect(config.featureFlags.generative.enabled).toBe(true);
  });

  it("keeps server-only secrets separate", () => {
    expect(
      resolveServerOnlyRuntimeConfig({
        COVEO_PLATFORM_API_KEY: "secret",
        COVEO_AUTHENTICATED_SEARCH_API_KEY: "authenticated",
        COVEO_USER_ID: "user",
      }).coveo,
    ).toMatchObject({
      authenticatedSearchApiKey: "authenticated",
      platformApiKey: "secret",
      userId: "user",
    });
  });

  it("normalizes environment names and exposes fallback config", () => {
    expect(normalizeEnvironment("test")).toBe("test");
    expect(normalizeEnvironment("production")).toBe("production");
    expect(normalizeEnvironment("preview")).toBe("development");
    expect(fallbackRuntimeConfig.searchProvider).toBe("mock");
  });
});
