import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GenerativeFeedback } from "@/components/generative/GenerativeFeedback";
import { AnalyticsProviderRoot, type AnalyticsProvider } from "@/features/analytics/analytics";
import type { FeedbackProvider } from "@/features/generative/providers/feedback-provider";

const answer = {
  id: "answer-1",
  answer: "Generated answer",
  citations: [],
  query: "digital",
};

function renderFeedback(feedbackProvider: FeedbackProvider, analyticsProvider: AnalyticsProvider = { track: vi.fn() }) {
  render(
    <AnalyticsProviderRoot enabled provider={analyticsProvider}>
      <GenerativeFeedback answer={answer} feedbackProvider={feedbackProvider} />
    </AnalyticsProviderRoot>,
  );

  return analyticsProvider;
}

describe("GenerativeFeedback", () => {
  afterEach(() => {
    cleanup();
  });

  it("submits negative feedback with a reason and prevents duplicate submission", async () => {
    const submitFeedback = vi.fn().mockResolvedValue(undefined);
    const analyticsProvider = renderFeedback({ submitFeedback });

    await userEvent.click(screen.getByRole("button", { name: "Not helpful" }));
    await userEvent.click(screen.getByRole("button", { name: "Incorrect" }));
    await userEvent.click(screen.getByRole("button", { name: "Helpful" }));

    expect(submitFeedback).toHaveBeenCalledTimes(1);
    expect(submitFeedback).toHaveBeenCalledWith(
      expect.objectContaining({ reason: "incorrect", value: "not-helpful" }),
    );
    expect(analyticsProvider.track).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "generative_feedback_submitted",
        payload: expect.objectContaining({ reason: "incorrect" }),
      }),
    );
  });

  it("renders a feedback error", async () => {
    renderFeedback({ submitFeedback: vi.fn().mockRejectedValue(new Error("failed")) });

    await userEvent.click(screen.getByRole("button", { name: "Helpful" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Feedback could not be submitted.",
    );
  });
});
