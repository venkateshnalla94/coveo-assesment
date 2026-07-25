import type { FeatureFlagOverrides } from "@/features/feature-flags/feature-flags";

export type BooleanParseResult =
  | { ok: true; value: boolean }
  | { ok: false; reason: "empty" | "invalid"; value: undefined };

export function parseStrictBoolean(value: string | undefined): BooleanParseResult {
  if (value === undefined || value.trim() === "") {
    return { ok: false, reason: "empty", value: undefined };
  }

  const normalized = value.trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return { ok: true, value: true };
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return { ok: true, value: false };
  }

  return { ok: false, reason: "invalid", value: undefined };
}

export function readBooleanOverride(
  environment: Record<string, string | undefined>,
  key: string,
): boolean | undefined {
  const parsed = parseStrictBoolean(environment[key]);
  return parsed.ok ? parsed.value : undefined;
}

export function getEnvironmentFeatureFlagOverrides(
  environment: Record<string, string | undefined>,
): FeatureFlagOverrides {
  return {
    analytics: {
      enabled: readBooleanOverride(environment, "COVEO_FEATURE_ANALYTICS"),
    },
    conversation: {
      enabled: readBooleanOverride(environment, "COVEO_FEATURE_CONVERSATION_ENABLED"),
    },
    generative: {
      citations: readBooleanOverride(environment, "COVEO_FEATURE_GENERATIVE_CITATIONS"),
      disclaimer: readBooleanOverride(environment, "COVEO_FEATURE_GENERATIVE_DISCLAIMER"),
      enabled: readBooleanOverride(environment, "COVEO_FEATURE_GENERATIVE_ENABLED"),
      feedback: readBooleanOverride(environment, "COVEO_FEATURE_GENERATIVE_FEEDBACK"),
      streaming: readBooleanOverride(environment, "COVEO_FEATURE_GENERATIVE_STREAMING"),
    },
    trending: {
      enabled: readBooleanOverride(environment, "COVEO_FEATURE_TRENDING_ENABLED"),
    },
  };
}
