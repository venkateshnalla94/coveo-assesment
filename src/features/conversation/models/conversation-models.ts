import type { GenerativeCitation } from "@/features/generative/models/generative-models";

export type ConversationRole = "user" | "assistant";

export type ConversationMessageStatus = "streaming" | "done" | "no-answer" | "error";

export interface ChatMessage {
  id: string;
  role: ConversationRole;
  content: string;
  citations?: GenerativeCitation[];
  status?: ConversationMessageStatus;
  errorMessage?: string;
}

export type ConversationStepName = "Searching" | "Thinking" | "Answering";

export type PageContextKind = "home" | "catalog" | "blog" | "article" | "product";

export interface PageContext {
  path: string;
  kind: PageContextKind;
  title?: string;
  id?: string;
  query?: string;
}

/** The Search Agent's own conversation state, echoed back on `/follow-up` calls. Opaque to the UI. */
export interface ConversationSession {
  conversationId?: string;
  conversationToken?: string;
}
