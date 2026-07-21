export type DevelopmentScenario =
  | "default"
  | "loading"
  | "empty"
  | "error"
  | "partial"
  | "generative"
  | "generative-error"
  | "generative-no-answer"
  | "trending-empty"
  | "trending-error";

export const DEFAULT_DEVELOPMENT_SCENARIO: DevelopmentScenario = "default";

const scenarios = new Set<DevelopmentScenario>([
  "default",
  "loading",
  "empty",
  "error",
  "partial",
  "generative",
  "generative-error",
  "generative-no-answer",
  "trending-empty",
  "trending-error",
]);

export function isDevelopmentScenario(value: string | undefined): value is DevelopmentScenario {
  return Boolean(value && scenarios.has(value as DevelopmentScenario));
}

export function resolveDevelopmentScenario({
  environment,
  queryValue,
}: {
  environment: "development" | "test" | "production";
  queryValue?: string;
}): DevelopmentScenario {
  if (environment === "production") {
    return DEFAULT_DEVELOPMENT_SCENARIO;
  }

  return isDevelopmentScenario(queryValue) ? queryValue : DEFAULT_DEVELOPMENT_SCENARIO;
}
