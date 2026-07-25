import type { ConversationStepName } from "@/features/conversation/models/conversation-models";

const STEP_LABELS: Record<ConversationStepName, string> = {
  Answering: "Answering…",
  Searching: "Searching…",
  Thinking: "Thinking…",
};

export function AgentStepIndicator({ stepName }: { stepName: ConversationStepName }) {
  return (
    <div aria-live="polite" className="agent-step-indicator">
      <span className="agent-step-dot" aria-hidden="true" />
      {STEP_LABELS[stepName]}
    </div>
  );
}
