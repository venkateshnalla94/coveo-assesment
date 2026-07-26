"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

import { AgentComposer } from "@/components/conversation/AgentComposer";
import { AgentTranscript } from "@/components/conversation/AgentTranscript";
import type { ChatMessage, ConversationStepName } from "@/features/conversation/models/conversation-models";

export function AgentPanel({
  currentStep,
  isStreaming,
  messages,
  onClose,
  onSend,
  onStop,
  showCitations,
}: {
  currentStep: ConversationStepName | undefined;
  isStreaming: boolean;
  messages: ChatMessage[];
  onClose: () => void;
  onSend: (question: string) => void;
  onStop: () => void;
  showCitations: boolean;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Move focus into the dialog on open, matching the ProductDetailsDrawer/GenerativeAnswer
  // modal pattern elsewhere in the app — this panel only ever mounts while open, so a
  // mount-only effect is enough (no isOpen prop to key off).
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="drawer-backdrop drawer-backdrop-right agent-panel-backdrop" role="presentation">
      <section aria-label="Conversational search assistant" aria-modal="true" className="agent-panel" role="dialog">
        <div className="drawer-header">
          <h2>Ask RoboMotion</h2>
          <button
            aria-label="Close conversational search assistant"
            className="icon-button"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <AgentTranscript currentStep={currentStep} messages={messages} onSend={onSend} showCitations={showCitations} />
        <AgentComposer isStreaming={isStreaming} onSend={onSend} onStop={onStop} />
      </section>
    </div>
  );
}
