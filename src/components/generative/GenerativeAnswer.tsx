"use client";

import { RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useReducer, useRef, useState } from "react";

import { GenerativeAnswerContent } from "@/components/generative/GenerativeAnswerContent";
import { GenerativeAnswerSkeleton } from "@/components/generative/GenerativeAnswerSkeleton";
import { GenerativeError } from "@/components/generative/GenerativeError";
import { GenerativeFeedback } from "@/components/generative/GenerativeFeedback";
import { GenerativeNoAnswer } from "@/components/generative/GenerativeNoAnswer";
import { useAnalytics } from "@/features/analytics/analytics";
import type { FeedbackProvider } from "@/features/generative/providers/feedback-provider";
import type { GenerativeProvider } from "@/features/generative/providers/generative-provider";
import {
  generativeStateReducer,
  getFriendlyGenerativeError,
} from "@/features/generative/services/generative-state";
import type { SearchFeatureFlags } from "@/lib/features/search-feature-flags";

export function GenerativeAnswer({
  feedbackProvider,
  featureFlags,
  provider,
  query,
}: {
  feedbackProvider: FeedbackProvider;
  featureFlags: Pick<
    SearchFeatureFlags,
    | "enableGenerativeAnswers"
    | "enableGenerativeCitations"
    | "enableGenerativeDisclaimer"
    | "enableGenerativeFeedback"
    | "enableGenerativeStreaming"
  >;
  provider: GenerativeProvider;
  query: string;
}) {
  const analytics = useAnalytics();
  const [state, dispatch] = useReducer(generativeStateReducer, { status: "idle" });
  const [retryCount, setRetryCount] = useState(0);
  const lastRequestedQuery = useRef("");
  const trackedStateKey = useRef("");
  const trimmedQuery = query.trim();

  useEffect(() => {
    if (!featureFlags.enableGenerativeAnswers || !trimmedQuery) {
      dispatch({ type: "reset" });
      return;
    }

    if (lastRequestedQuery.current === trimmedQuery) {
      return;
    }

    let isCurrent = true;
    lastRequestedQuery.current = trimmedQuery;
    trackedStateKey.current = "";
    dispatch({ type: "requested", query: trimmedQuery });
    analytics.track("generative_answer_requested", { query: trimmedQuery });

    provider
      .generate(trimmedQuery)
      .then((answer) => {
        if (!isCurrent) {
          return;
        }

        if (!answer) {
          dispatch({ type: "no-answer", query: trimmedQuery });
          return;
        }

        if (featureFlags.enableGenerativeStreaming) {
          dispatch({
            type: "streamed",
            query: trimmedQuery,
            partialAnswer: answer.answer.slice(0, Math.ceil(answer.answer.length / 2)),
            citations: featureFlags.enableGenerativeCitations ? answer.citations : [],
          });
          window.setTimeout(() => {
            if (isCurrent) {
              dispatch({
                type: "completed",
                answer: {
                  ...answer,
                  citations: featureFlags.enableGenerativeCitations ? answer.citations : [],
                },
              });
            }
          }, 60);
          return;
        }

        dispatch({
          type: "completed",
          answer: {
            ...answer,
            citations: featureFlags.enableGenerativeCitations ? answer.citations : [],
          },
        });
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          dispatch({
            type: "failed",
            query: trimmedQuery,
            message: getFriendlyGenerativeError(error),
          });
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [
    analytics,
    featureFlags.enableGenerativeAnswers,
    featureFlags.enableGenerativeCitations,
    featureFlags.enableGenerativeStreaming,
    provider,
    retryCount,
    trimmedQuery,
  ]);

  useEffect(() => {
    const stateKey = JSON.stringify(state);

    if (trackedStateKey.current === stateKey) {
      return;
    }

    trackedStateKey.current = stateKey;

    if (state.status === "complete") {
      analytics.track("generative_answer_viewed", {
        answerId: state.data.id,
        citationCount: state.data.citations.length,
        query: state.data.query,
      });
    }

    if (state.status === "no-answer") {
      analytics.track("generative_no_answer", { query: state.query });
    }

    if (state.status === "error") {
      analytics.track("generative_answer_failed", { query: state.query, message: state.message });
    }
  }, [analytics, state]);

  if (!featureFlags.enableGenerativeAnswers) {
    return null;
  }

  function retry() {
    lastRequestedQuery.current = "";
    dispatch({ type: "reset" });
    setRetryCount((count) => count + 1);
  }

  return (
    <section className="generative-panel" aria-label="Generated answer">
      <div className="generative-header">
        <div>
          <span className="result-type">
            <Sparkles aria-hidden="true" size={17} />
            Generated answer
          </span>
          {featureFlags.enableGenerativeDisclaimer ? (
            <p>Fixture-backed in sample mode. Verify cited sources before using the answer.</p>
          ) : null}
        </div>
        {state.status === "complete" ? (
          <button className="icon-button" onClick={retry} type="button" aria-label="Regenerate answer">
            <RefreshCw aria-hidden="true" size={18} />
          </button>
        ) : null}
      </div>

      {state.status === "idle" ? <p className="muted-copy">Submit a search to generate an answer.</p> : null}
      {state.status === "loading" ? <GenerativeAnswerSkeleton query={state.query} /> : null}
      {state.status === "streaming" ? (
        <GenerativeAnswerContent
          answer={state.partialAnswer}
          citations={state.citations}
          query={state.query}
        />
      ) : null}
      {state.status === "complete" ? (
        <>
          <GenerativeAnswerContent
            answer={state.data.answer}
            citations={state.data.citations}
            query={state.data.query}
          />
          {featureFlags.enableGenerativeFeedback ? (
            <GenerativeFeedback answer={state.data} feedbackProvider={feedbackProvider} />
          ) : null}
        </>
      ) : null}
      {state.status === "no-answer" ? (
        <GenerativeNoAnswer onRetry={retry} query={state.query} />
      ) : null}
      {state.status === "error" ? (
        <GenerativeError message={state.message} onRetry={retry} />
      ) : null}
    </section>
  );
}
