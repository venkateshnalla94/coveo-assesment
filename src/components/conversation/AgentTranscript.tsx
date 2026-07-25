import { useEffect, useRef } from "react";

import { AgentMessage } from "@/components/conversation/AgentMessage";
import { AgentStepIndicator } from "@/components/conversation/AgentStepIndicator";
import type { ChatMessage, ConversationStepName } from "@/features/conversation/models/conversation-models";

export function AgentTranscript({
  currentStep,
  messages,
  showCitations,
}: {
  currentStep: ConversationStepName | undefined;
  messages: ChatMessage[];
  showCitations: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, currentStep]);

  const lastMessage = messages.at(-1);
  const showStepIndicator = Boolean(
    currentStep && lastMessage?.role === "assistant" && lastMessage.status === "streaming" && !lastMessage.content,
  );

  if (messages.length === 0) {
    return (
      <div className="agent-transcript agent-transcript-empty">
        <p className="muted-copy">
          Ask about RoboMotion products, setup, calibration, or safety — answers are grounded in our indexed content.
        </p>
      </div>
    );
  }

  return (
    <div className="agent-transcript" role="log" aria-live="polite">
      {messages.map((message) => (
        <AgentMessage key={message.id} message={message} showCitations={showCitations} />
      ))}
      {showStepIndicator && currentStep ? <AgentStepIndicator stepName={currentStep} /> : null}
      <div ref={endRef} />
    </div>
  );
}
