"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";

import { useAnalytics } from "@/features/analytics/analytics";
import type {
  GenerativeAnswer,
  GenerativeFeedbackReason,
  GenerativeFeedbackValue,
} from "@/features/generative/models/generative-models";
import type { FeedbackProvider } from "@/features/generative/providers/feedback-provider";

const negativeReasons: Array<{ label: string; value: GenerativeFeedbackReason }> = [
  { label: "Incorrect", value: "incorrect" },
  { label: "Incomplete", value: "incomplete" },
  { label: "Outdated", value: "outdated" },
  { label: "Not relevant", value: "not-relevant" },
  { label: "Other", value: "other" },
];

export function GenerativeFeedback({
  answer,
  feedbackProvider,
}: {
  answer: GenerativeAnswer;
  feedbackProvider: FeedbackProvider;
}) {
  const analytics = useAnalytics();
  const [selectedValue, setSelectedValue] = useState<GenerativeFeedbackValue | undefined>();
  const [selectedReason, setSelectedReason] = useState<GenerativeFeedbackReason | undefined>();
  const [status, setStatus] = useState<"idle" | "submitting" | "submitted" | "error">("idle");
  const isSubmitted = status === "submitted";

  async function submit(value: GenerativeFeedbackValue, reason?: GenerativeFeedbackReason) {
    if (isSubmitted || status === "submitting") {
      return;
    }

    setSelectedValue(value);
    setSelectedReason(reason);
    setStatus("submitting");

    try {
      await feedbackProvider.submitFeedback({
        answerId: answer.id,
        query: answer.query,
        value,
        ...(reason ? { reason } : {}),
      });
      analytics.track("generative_feedback_submitted", {
        answerId: answer.id,
        query: answer.query,
        value,
        reason,
      });
      setStatus("submitted");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="generative-feedback" aria-live="polite">
      <span>Was this answer helpful?</span>
      <div className="feedback-actions">
        <button
          aria-pressed={selectedValue === "helpful"}
          disabled={isSubmitted}
          onClick={() => void submit("helpful")}
          type="button"
        >
          <ThumbsUp aria-hidden="true" size={16} />
          Helpful
        </button>
        <button
          aria-pressed={selectedValue === "not-helpful"}
          disabled={isSubmitted}
          onClick={() => setSelectedValue("not-helpful")}
          type="button"
        >
          <ThumbsDown aria-hidden="true" size={16} />
          Not helpful
        </button>
      </div>
      {selectedValue === "not-helpful" && !isSubmitted ? (
        <div className="feedback-reasons" aria-label="Feedback reason">
          {negativeReasons.map((reason) => (
            <button
              aria-pressed={selectedReason === reason.value}
              key={reason.value}
              onClick={() => void submit("not-helpful", reason.value)}
              type="button"
            >
              {reason.label}
            </button>
          ))}
        </div>
      ) : null}
      {status === "submitted" ? <p>Feedback submitted.</p> : null}
      {status === "error" ? <p role="alert">Feedback could not be submitted.</p> : null}
    </div>
  );
}
