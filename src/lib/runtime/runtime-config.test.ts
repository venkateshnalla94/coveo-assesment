import { describe, expect, it } from "vitest";

import {
  fallbackRuntimeConfig,
  normalizeEnvironment,
  resolveRuntimeConfig,
  resolveServerOnlyRuntimeConfig,
} from "./runtime-config";

describe("runtime config", () => {
  it("resolves public search-token runtime config without serializing secrets", () => {
    const config = resolveRuntimeConfig({
      environment: {
        COVEO_AUTH_MODE: "search-token",
        COVEO_AUTHENTICATED_SEARCH_API_KEY: "private-token-minting-key",
        COVEO_ORGANIZATION_ID: "org",
        COVEO_PLATFORM_API_KEY: "secret",
        NODE_ENV: "production",
      },
    });

    expect(config.environment).toBe("production");
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

  it("ignores obsolete demo profile, scenario, and flag overrides", () => {
    const config = resolveRuntimeConfig({
      environment: {
        COVEO_FEATURE_GENERATIVE_ENABLED: "false",
        COVEO_FEATURE_TRENDING_ENABLED: "false",
        NODE_ENV: "test",
      },
    });

    expect(config.featureFlags.generative.enabled).toBe(false);
    expect(config.featureFlags.trending.enabled).toBe(false);
    expect(config).not.toHaveProperty("demoProfile");
    expect(config).not.toHaveProperty("scenario");
    expect(config).not.toHaveProperty("searchProvider");
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
    expect(fallbackRuntimeConfig.featureFlags.trending.enabled).toBe(true);
  });
});
