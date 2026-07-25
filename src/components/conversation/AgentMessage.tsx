import { AlertCircle } from "lucide-react";
import Markdown from "react-markdown";
import type { Components } from "react-markdown";

import { AgentCitations } from "@/components/conversation/AgentCitations";
import type { ChatMessage } from "@/features/conversation/models/conversation-models";

// Open answer-body links safely in a new tab; react-markdown never renders raw HTML from the
// source text (no rehype-raw plugin here), so this is the only link surface to harden.
const MARKDOWN_COMPONENTS: Components = {
  a: ({ children, ...props }) => (
    <a {...props} rel="noreferrer" target="_blank">
      {children}
    </a>
  ),
};

export function AgentMessage({ message, showCitations }: { message: ChatMessage; showCitations: boolean }) {
  if (message.role === "user") {
    return (
      <div className="agent-message agent-message-user">
        <p>{message.content}</p>
      </div>
    );
  }

  if (message.status === "error") {
    return (
      <div className="agent-message agent-message-assistant agent-message-error">
        <AlertCircle aria-hidden="true" size={16} />
        <p>{message.errorMessage ?? "The conversational agent could not respond."}</p>
      </div>
    );
  }

  if (message.status === "no-answer") {
    return (
      <div className="agent-message agent-message-assistant">
        <p className="muted-copy">No answer was found in the configured content for that question.</p>
      </div>
    );
  }

  if (!message.content) {
    return null;
  }

  return (
    <div className="agent-message agent-message-assistant">
      <div className="agent-message-text">
        <Markdown components={MARKDOWN_COMPONENTS}>{message.content}</Markdown>
      </div>
      {showCitations && message.status === "done" && message.citations && message.citations.length > 0 ? (
        <AgentCitations citations={message.citations} />
      ) : null}
    </div>
  );
}
