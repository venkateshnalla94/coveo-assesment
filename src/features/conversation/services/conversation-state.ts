import type { GenerativeCitation } from "@/features/generative/models/generative-models";
import type {
  ChatMessage,
  ConversationSession,
  ConversationStepName,
} from "@/features/conversation/models/conversation-models";

export interface ConversationState {
  messages: ChatMessage[];
  session: ConversationSession;
  currentStep?: ConversationStepName;
}

export const initialConversationState: ConversationState = {
  messages: [],
  session: {},
};

export type ConversationStateAction =
  | { type: "sent"; userMessageId: string; assistantMessageId: string; content: string }
  | { type: "step"; assistantMessageId: string; stepName: ConversationStepName }
  | { type: "token"; assistantMessageId: string; delta: string }
  | { type: "citations"; assistantMessageId: string; citations: GenerativeCitation[] }
  | { type: "done"; assistantMessageId: string; session: ConversationSession }
  | { type: "no-answer"; assistantMessageId: string; session: ConversationSession }
  | { type: "failed"; assistantMessageId: string; message: string }
  | { type: "aborted"; assistantMessageId: string }
  | { type: "reset" };

function updateMessage(
  messages: ChatMessage[],
  messageId: string,
  update: (message: ChatMessage) => ChatMessage,
): ChatMessage[] {
  return messages.map((message) => (message.id === messageId ? update(message) : message));
}

export function conversationStateReducer(
  state: ConversationState,
  action: ConversationStateAction,
): ConversationState {
  switch (action.type) {
    case "sent":
      return {
        ...state,
        currentStep: undefined,
        messages: [
          ...state.messages,
          { content: action.content, id: action.userMessageId, role: "user" },
          { content: "", id: action.assistantMessageId, role: "assistant", status: "streaming" },
        ],
      };
    case "step":
      return { ...state, currentStep: action.stepName };
    case "token":
      return {
        ...state,
        messages: updateMessage(state.messages, action.assistantMessageId, (message) => ({
          ...message,
          content: message.content + action.delta,
        })),
      };
    case "citations":
      return {
        ...state,
        messages: updateMessage(state.messages, action.assistantMessageId, (message) => ({
          ...message,
          citations: action.citations,
        })),
      };
    case "done":
      return {
        ...state,
        currentStep: undefined,
        messages: updateMessage(state.messages, action.assistantMessageId, (message) => ({
          ...message,
          status: "done",
        })),
        session: action.session,
      };
    case "no-answer":
      return {
        ...state,
        currentStep: undefined,
        messages: updateMessage(state.messages, action.assistantMessageId, (message) => ({
          ...message,
          status: "no-answer",
        })),
        session: action.session,
      };
    case "failed":
      return {
        ...state,
        currentStep: undefined,
        messages: updateMessage(state.messages, action.assistantMessageId, (message) => ({
          ...message,
          errorMessage: action.message,
          status: "error",
        })),
      };
    case "aborted":
      return {
        ...state,
        currentStep: undefined,
        messages: updateMessage(state.messages, action.assistantMessageId, (message) => ({
          ...message,
          status: message.content ? "done" : "error",
          errorMessage: message.content ? undefined : "Stopped.",
        })),
      };
    case "reset":
      return initialConversationState;
  }
}

export function isConversationStreaming(state: ConversationState) {
  return state.messages.some((message) => message.status === "streaming");
}
