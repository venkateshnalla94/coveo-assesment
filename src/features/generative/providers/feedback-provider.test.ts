import { describe, expect, it } from "vitest";

import { InMemoryFeedbackProvider } from "@/features/generative/providers/feedback-provider";

describe("InMemoryFeedbackProvider", () => {
  it("accepts first and duplicate submissions without requiring persistence", async () => {
    const provider = new InMemoryFeedbackProvider();
    const input = {
      answerId: "a1",
      query: "digital",
      value: "helpful" as const,
    };

    await expect(provider.submitFeedback(input)).resolves.toBeUndefined();
    await expect(provider.submitFeedback(input)).resolves.toBeUndefined();
  });
});
