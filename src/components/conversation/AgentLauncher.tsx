import { MessageCircle } from "lucide-react";
import type { Ref } from "react";

export function AgentLauncher({ buttonRef, onOpen }: { buttonRef?: Ref<HTMLButtonElement>; onOpen: () => void }) {
  return (
    <button
      aria-label="Open conversational search assistant"
      className="agent-launcher"
      onClick={onOpen}
      ref={buttonRef}
      type="button"
    >
      <MessageCircle aria-hidden="true" size={20} />
      Ask RoboMotion
    </button>
  );
}
