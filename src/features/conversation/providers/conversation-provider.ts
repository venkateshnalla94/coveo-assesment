import type { GenerativeCitation } from "@/features/generative/models/generative-models";
import type {
  ConversationSession,
  ConversationStepName,
  PageContext,
} from "@/features/conversation/models/conversation-models";

export interface ConversationStreamInput {
  q: string;
  pageContext?: PageContext;
  session: ConversationSession;
}

export interface ConversationStreamCallbacks {
  onStep?: (stepName: ConversationStepName) => void;
  onToken: (delta: string) => void;
  onCitations?: (citations: GenerativeCitation[]) => void;
}

export type ConversationStreamResult =
  | { status: "answered"; session: ConversationSession }
  | { status: "no-answer"; session: ConversationSession };

export interface ConversationProvider {
  stream(
    input: ConversationStreamInput,
    callbacks: ConversationStreamCallbacks,
    options?: { signal?: AbortSignal },
  ): Promise<ConversationStreamResult>;
}
