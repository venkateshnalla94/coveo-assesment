import { describe, expect, it } from "vitest";

import { MockGenerativeProvider } from "@/features/generative/providers/mock-generative-provider";

describe("MockGenerativeProvider", () => {
  it("returns deterministic fixture answers and citations", async () => {
    const answer = await new MockGenerativeProvider().generate("digital transformation");

    expect(answer).toMatchObject({
      id: "mock-ga-digital-transformation",
      query: "digital transformation",
    });
    expect(answer?.citations).toHaveLength(2);
  });

  it("supports no-answer and error scenarios from query text", async () => {
    await expect(new MockGenerativeProvider().generate("no answer please")).resolves.toBeNull();
    await expect(new MockGenerativeProvider().generate("trigger error")).rejects.toThrow(
      "Mock generative provider failed",
    );
  });
});
