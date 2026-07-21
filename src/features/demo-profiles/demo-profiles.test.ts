import { describe, expect, it } from "vitest";

import { DEFAULT_DEMO_PROFILE_ID, demoProfiles, resolveDemoProfile } from "./demo-profiles";

describe("demo profiles", () => {
  it("falls back safely for unknown profile ids", () => {
    expect(resolveDemoProfile("unknown").id).toBe(DEFAULT_DEMO_PROFILE_ID);
  });

  it("defines the required Phase 5 profiles", () => {
    expect(Object.keys(demoProfiles).sort()).toEqual([
      "customer-support",
      "developer-documentation",
      "ecommerce",
      "minimal",
    ]);
  });

  it("keeps minimal profile optional features disabled", () => {
    expect(demoProfiles.minimal.featureFlags).toMatchObject({
      facets: { enabled: false },
      generative: { enabled: false },
      insights: { enabled: false },
      trending: { enabled: false },
    });
  });
});
