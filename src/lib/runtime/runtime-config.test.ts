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
    expect(JSON.stringify(config)).not.toContain("secret");
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

  it("keeps server-only secrets separate", () => {
    expect(
      resolveServerOnlyRuntimeConfig({
        COVEO_PLATFORM_API_KEY: "secret",
        COVEO_USER_ID: "user",
      }).coveo,
    ).toMatchObject({ platformApiKey: "secret", userId: "user" });
  });

  it("normalizes environment names and exposes fallback config", () => {
    expect(normalizeEnvironment("test")).toBe("test");
    expect(normalizeEnvironment("production")).toBe("production");
    expect(normalizeEnvironment("preview")).toBe("development");
    expect(fallbackRuntimeConfig.searchProvider).toBe("mock");
  });
});
