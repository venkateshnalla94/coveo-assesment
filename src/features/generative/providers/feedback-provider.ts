import type { GenerativeFeedbackInput } from "@/features/generative/models/generative-models";

export interface FeedbackProvider {
  submitFeedback(input: GenerativeFeedbackInput): Promise<void>;
}

export class InMemoryFeedbackProvider implements FeedbackProvider {
  private readonly submissions = new Set<string>();

  async submitFeedback(input: GenerativeFeedbackInput): Promise<void> {
    const key = `${input.answerId}:${input.value}:${input.reason ?? "none"}`;

    if (this.submissions.has(key)) {
      return;
    }

    this.submissions.add(key);
  }
}
