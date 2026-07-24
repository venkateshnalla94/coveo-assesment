import { describe, expect, it } from "vitest";

import { getEnvironmentFeatureFlagOverrides, parseStrictBoolean } from "./env-feature-flags";
import { defaultFeatureFlags, resolveFeatureFlags } from "./feature-flags";

describe("feature flag resolution", () => {
  it("deep merges known boolean keys in deterministic precedence order", () => {
    const resolved = resolveFeatureFlags({
      defaults: defaultFeatureFlags,
      environment: { generative: { enabled: true }, trending: { enabled: false } },
    });

    expect(resolved.generative.enabled).toBe(true);
    expect(resolved.generative.citations).toBe(true);
    expect(resolved.trending.enabled).toBe(false);
    expect(resolved.analytics.enabled).toBe(true);
  });

  it("ignores malformed override values", () => {
    const resolved = resolveFeatureFlags({
      defaults: defaultFeatureFlags,
      environment: { generative: { enabled: "true" as unknown as boolean } },
    });

    expect(resolved.generative.enabled).toBe(false);
  });

  it("parses booleans strictly", () => {
    expect(parseStrictBoolean("true")).toEqual({ ok: true, value: true });
    expect(parseStrictBoolean("0")).toEqual({ ok: true, value: false });
    expect(parseStrictBoolean("maybe")).toEqual({ ok: false, reason: "invalid", value: undefined });
  });

  it("maps environment variables into hierarchical overrides", () => {
    expect(
      getEnvironmentFeatureFlagOverrides({
        COVEO_FEATURE_ANALYTICS: "false",
        COVEO_FEATURE_GENERATIVE_ENABLED: "true",
      }),
    ).toMatchObject({
      analytics: { enabled: false },
      generative: { enabled: true },
    });
  });
});
