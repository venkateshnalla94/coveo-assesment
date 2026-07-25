"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";

import { AgentLauncher } from "@/components/conversation/AgentLauncher";
import { AgentPanel } from "@/components/conversation/AgentPanel";
import { usePageContext } from "@/components/conversation/AgentContextProvider";
import {
  AnalyticsProviderRoot,
  ConsoleAnalyticsProvider,
  useAnalytics,
} from "@/features/analytics/analytics";
import type { ConversationProvider } from "@/features/conversation/providers/conversation-provider";
import { getFriendlyConversationError } from "@/features/conversation/providers/conversation-errors";
import {
  conversationStateReducer,
  initialConversationState,
  isConversationStreaming,
} from "@/features/conversation/services/conversation-state";

const consoleAnalyticsProvider = new ConsoleAnalyticsProvider();

export function ConversationalAgent({
  citationsEnabled = true,
  enabled,
  provider,
}: {
  citationsEnabled?: boolean;
  enabled: boolean;
  provider: ConversationProvider;
}) {
  if (!enabled) {
    return null;
  }

  return (
    <AnalyticsProviderRoot enabled provider={consoleAnalyticsProvider}>
      <ConversationalAgentContent citationsEnabled={citationsEnabled} provider={provider} />
    </AnalyticsProviderRoot>
  );
}

function ConversationalAgentContent({
  citationsEnabled,
  provider,
}: {
  citationsEnabled: boolean;
  provider: ConversationProvider;
}) {
  const analytics = useAnalytics();
  const pageContext = usePageContext();
  const [isOpen, setIsOpen] = useState(false);
  const [state, dispatch] = useReducer(conversationStateReducer, initialConversationState);
  const abortControllerRef = useRef<AbortController | null>(null);
  const launcherButtonRef = useRef<HTMLButtonElement>(null);
  const hasOpenedRef = useRef(false);
  const isStreaming = useMemo(() => isConversationStreaming(state), [state]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Return focus to the launcher once it re-mounts after the panel closes. The panel itself
  // moves focus in on open (see AgentPanel), so this completes the round trip — matching the
  // ProductDetailsDrawer/GenerativeAnswer modal focus pattern used elsewhere in the app.
  useEffect(() => {
    if (isOpen) {
      hasOpenedRef.current = true;
      return;
    }

    if (hasOpenedRef.current) {
      launcherButtonRef.current?.focus();
    }
  }, [isOpen]);

  function send(question: string) {
    const userMessageId = `user-${Date.now()}`;
    const assistantMessageId = `assistant-${Date.now()}`;
    const session = state.session;

    dispatch({ assistantMessageId, content: question, type: "sent", userMessageId });
    analytics.track("conversation_message_sent", { pageContextKind: pageContext.kind, question });

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    provider
      .stream(
        { pageContext, q: question, session },
        {
          onCitations: (citations) => dispatch({ assistantMessageId, citations, type: "citations" }),
          onStep: (stepName) => dispatch({ assistantMessageId, stepName, type: "step" }),
          onToken: (delta) => dispatch({ assistantMessageId, delta, type: "token" }),
        },
        { signal: abortController.signal },
      )
      .then((result) => {
        if (result.status === "answered") {
          dispatch({ assistantMessageId, session: result.session, type: "done" });
          analytics.track("conversation_answer_viewed", { pageContextKind: pageContext.kind, question });
        } else {
          dispatch({ assistantMessageId, session: result.session, type: "no-answer" });
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          dispatch({ assistantMessageId, type: "aborted" });
          return;
        }

        const message = getFriendlyConversationError(error);
        dispatch({ assistantMessageId, message, type: "failed" });
        analytics.track("conversation_answer_failed", { message, pageContextKind: pageContext.kind, question });
      });
  }

  function stop() {
    abortControllerRef.current?.abort();
  }

  return (
    <>
      {!isOpen ? <AgentLauncher buttonRef={launcherButtonRef} onOpen={() => setIsOpen(true)} /> : null}
      {isOpen ? (
        <AgentPanel
          currentStep={state.currentStep}
          isStreaming={isStreaming}
          messages={state.messages}
          onClose={() => setIsOpen(false)}
          onSend={send}
          onStop={stop}
          showCitations={citationsEnabled}
        />
      ) : null}
    </>
  );
}
