import { describe, expect, it, vi } from "vitest";

import { MockConversationProvider } from "@/features/conversation/providers/mock-conversation-provider";

describe("MockConversationProvider", () => {
  it("streams a scripted step -> token -> citations sequence and resolves answered", async () => {
    const onStep = vi.fn();
    const onToken = vi.fn();
    const onCitations = vi.fn();

    const result = await new MockConversationProvider().stream(
      { q: "What is RoboMotion?", session: {} },
      { onCitations, onStep, onToken },
    );

    expect(onStep).toHaveBeenNthCalledWith(1, "Searching");
    expect(onStep).toHaveBeenNthCalledWith(2, "Thinking");
    expect(onStep).toHaveBeenNthCalledWith(3, "Answering");
    expect(onToken).toHaveBeenCalled();
    expect(onCitations).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: "mock-conversation-citation" })]),
    );
    expect(result).toEqual({
      session: { conversationId: "mock-conversation", conversationToken: "mock-conversation-token" },
      status: "answered",
    });
  });

  it("preserves the caller's existing conversationId when answering", async () => {
    const result = await new MockConversationProvider().stream(
      { q: "follow up", session: { conversationId: "existing-conv" } },
      { onToken: vi.fn() },
    );

    expect(result).toMatchObject({ session: { conversationId: "existing-conv" } });
  });

  it("supports no-answer and error scenarios from query text, preserving the session on no-answer", async () => {
    const session = { conversationId: "conv-1" };
    await expect(
      new MockConversationProvider().stream({ q: "no answer please", session }, { onToken: vi.fn() }),
    ).resolves.toEqual({ session, status: "no-answer" });

    await expect(
      new MockConversationProvider().stream({ q: "trigger error", session: {} }, { onToken: vi.fn() }),
    ).rejects.toThrow("Mock conversation provider failed");
  });

  it("resolves no-answer for an empty question", async () => {
    await expect(
      new MockConversationProvider().stream({ q: "   ", session: {} }, { onToken: vi.fn() }),
    ).resolves.toEqual({ session: {}, status: "no-answer" });
  });

  it("honors a configured behavior/delay/answer override", async () => {
    const onToken = vi.fn();
    const result = await new MockConversationProvider({ answer: "Custom answer", behavior: "answer", delayMs: 1 }).stream(
      { q: "anything", session: {} },
      { onToken },
    );

    expect(onToken.mock.calls.map((call) => call[0]).join("")).toBe("Custom answer ");
    expect(result.status).toBe("answered");
  });
});
