import { Send, Square } from "lucide-react";
import { useState, type KeyboardEvent } from "react";

const MAX_QUESTION_LENGTH = 300;

export function AgentComposer({
  isStreaming,
  onSend,
  onStop,
}: {
  isStreaming: boolean;
  onSend: (question: string) => void;
  onStop: () => void;
}) {
  const [value, setValue] = useState("");

  function submit() {
    const trimmed = value.trim();

    if (!trimmed || isStreaming) {
      return;
    }

    onSend(trimmed);
    setValue("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <div className="agent-composer">
      <textarea
        aria-label="Ask the conversational search assistant"
        disabled={isStreaming}
        maxLength={MAX_QUESTION_LENGTH}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask a question…"
        rows={1}
        value={value}
      />
      {isStreaming ? (
        <button aria-label="Stop generating" className="icon-button agent-composer-action" onClick={onStop} type="button">
          <Square aria-hidden="true" size={16} />
        </button>
      ) : (
        <button
          aria-label="Send question"
          className="icon-button agent-composer-action"
          disabled={!value.trim()}
          onClick={submit}
          type="button"
        >
          <Send aria-hidden="true" size={16} />
        </button>
      )}
    </div>
  );
}
