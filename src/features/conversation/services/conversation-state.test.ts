import { describe, expect, it } from "vitest";

import {
  conversationStateReducer,
  initialConversationState,
  isConversationStreaming,
} from "@/features/conversation/services/conversation-state";

const USER_ID = "user-1";
const ASSISTANT_ID = "assistant-1";

describe("conversationStateReducer", () => {
  it("appends a user message and a streaming assistant placeholder on send", () => {
    const state = conversationStateReducer(initialConversationState, {
      assistantMessageId: ASSISTANT_ID,
      content: "What is RoboMotion?",
      type: "sent",
      userMessageId: USER_ID,
    });

    expect(state.messages).toEqual([
      { content: "What is RoboMotion?", id: USER_ID, role: "user" },
      { content: "", id: ASSISTANT_ID, role: "assistant", status: "streaming" },
    ]);
    expect(isConversationStreaming(state)).toBe(true);
  });

  it("tracks the current step", () => {
    const sent = conversationStateReducer(initialConversationState, {
      assistantMessageId: ASSISTANT_ID,
      content: "q",
      type: "sent",
      userMessageId: USER_ID,
    });

    const stepped = conversationStateReducer(sent, {
      assistantMessageId: ASSISTANT_ID,
      stepName: "Searching",
      type: "step",
    });

    expect(stepped.currentStep).toBe("Searching");
  });

  it("accumulates token deltas onto the matching assistant message only", () => {
    let state = conversationStateReducer(initialConversationState, {
      assistantMessageId: ASSISTANT_ID,
      content: "q",
      type: "sent",
      userMessageId: USER_ID,
    });

    state = conversationStateReducer(state, { assistantMessageId: ASSISTANT_ID, delta: "Hello", type: "token" });
    state = conversationStateReducer(state, { assistantMessageId: ASSISTANT_ID, delta: " world", type: "token" });

    expect(state.messages[1]).toMatchObject({ content: "Hello world" });
    expect(state.messages[0]).toMatchObject({ content: "q" });
  });

  it("attaches citations to the assistant message", () => {
    let state = conversationStateReducer(initialConversationState, {
      assistantMessageId: ASSISTANT_ID,
      content: "q",
      type: "sent",
      userMessageId: USER_ID,
    });

    const citations = [{ id: "c1", title: "A", url: "https://a.test" }];
    state = conversationStateReducer(state, { assistantMessageId: ASSISTANT_ID, citations, type: "citations" });

    expect(state.messages[1]).toMatchObject({ citations });
  });

  it("marks the assistant message done and persists the session on done", () => {
    let state = conversationStateReducer(initialConversationState, {
      assistantMessageId: ASSISTANT_ID,
      content: "q",
      type: "sent",
      userMessageId: USER_ID,
    });

    const session = { conversationId: "conv-1", conversationToken: "token-1" };
    state = conversationStateReducer(state, { assistantMessageId: ASSISTANT_ID, session, type: "done" });

    expect(state.messages[1]).toMatchObject({ status: "done" });
    expect(state.session).toEqual(session);
    expect(state.currentStep).toBeUndefined();
    expect(isConversationStreaming(state)).toBe(false);
  });

  it("marks no-answer", () => {
    let state = conversationStateReducer(initialConversationState, {
      assistantMessageId: ASSISTANT_ID,
      content: "q",
      type: "sent",
      userMessageId: USER_ID,
    });

    const session = { conversationId: "conv-1", conversationToken: "token-1" };
    state = conversationStateReducer(state, { assistantMessageId: ASSISTANT_ID, session, type: "no-answer" });

    expect(state.messages[1]).toMatchObject({ status: "no-answer" });
    expect(state.session).toEqual(session);
  });

  it("marks failed with the friendly error message", () => {
    let state = conversationStateReducer(initialConversationState, {
      assistantMessageId: ASSISTANT_ID,
      content: "q",
      type: "sent",
      userMessageId: USER_ID,
    });

    state = conversationStateReducer(state, { assistantMessageId: ASSISTANT_ID, message: "boom", type: "failed" });

    expect(state.messages[1]).toMatchObject({ errorMessage: "boom", status: "error" });
  });

  it("treats an abort with partial content as done, and an abort with no content as an error", () => {
    const state = conversationStateReducer(initialConversationState, {
      assistantMessageId: ASSISTANT_ID,
      content: "q",
      type: "sent",
      userMessageId: USER_ID,
    });

    const withContent = conversationStateReducer(
      conversationStateReducer(state, { assistantMessageId: ASSISTANT_ID, delta: "partial", type: "token" }),
      { assistantMessageId: ASSISTANT_ID, type: "aborted" },
    );
    expect(withContent.messages[1]).toMatchObject({ status: "done" });

    const withoutContent = conversationStateReducer(state, { assistantMessageId: ASSISTANT_ID, type: "aborted" });
    expect(withoutContent.messages[1]).toMatchObject({ errorMessage: "Stopped.", status: "error" });
  });

  it("resets to the initial state", () => {
    const state = conversationStateReducer(initialConversationState, {
      assistantMessageId: ASSISTANT_ID,
      content: "q",
      type: "sent",
      userMessageId: USER_ID,
    });

    expect(conversationStateReducer(state, { type: "reset" })).toEqual(initialConversationState);
  });
});
