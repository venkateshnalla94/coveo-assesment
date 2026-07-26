import { useEffect, useRef } from "react";

import { AgentMessage } from "@/components/conversation/AgentMessage";
import { AgentStepIndicator } from "@/components/conversation/AgentStepIndicator";
import type { ChatMessage, ConversationStepName } from "@/features/conversation/models/conversation-models";

// Grounded in what the Search Agent actually indexes (blog content), not the product catalog —
// see CLAUDE.md's conversation-route boundary. Keep these aligned with real blog topics so a
// clicked suggestion reliably gets an answer instead of a no-answer/generic response.
const STARTER_PROMPTS = [
  "How do I calibrate a robotic arm before first use?",
  "What's a recommended preventive maintenance schedule?",
  "What safety certifications should I look for in a welding cell?",
];

export function AgentTranscript({
  currentStep,
  messages,
  onSend,
  showCitations,
}: {
  currentStep: ConversationStepName | undefined;
  messages: ChatMessage[];
  onSend: (question: string) => void;
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
        <ul className="agent-starter-prompts">
          {STARTER_PROMPTS.map((prompt) => (
            <li key={prompt}>
              <button className="agent-starter-prompt" onClick={() => onSend(prompt)} type="button">
                {prompt}
              </button>
            </li>
          ))}
        </ul>
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
