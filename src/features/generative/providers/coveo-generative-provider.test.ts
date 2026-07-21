import { describe, expect, it } from "vitest";

import { CoveoGenerativeProvider } from "@/features/generative/providers/coveo-generative-provider";

describe("CoveoGenerativeProvider", () => {
  it("fails safely until a server-side live integration exists", async () => {
    await expect(new CoveoGenerativeProvider().generate()).rejects.toThrow(
      "Live Coveo generative answers require a supported endpoint",
    );
  });
});
