import { describe, expect, it } from "vitest";

import { resolveDevelopmentScenario } from "./scenarios";

describe("development scenarios", () => {
  it("accepts known scenarios outside production", () => {
    expect(resolveDevelopmentScenario({ environment: "development", queryValue: "error" })).toBe(
      "error",
    );
  });

  it("rejects unknown and production scenarios safely", () => {
    expect(resolveDevelopmentScenario({ environment: "test", queryValue: "unknown" })).toBe(
      "default",
    );
    expect(resolveDevelopmentScenario({ environment: "production", queryValue: "error" })).toBe(
      "default",
    );
  });
});
