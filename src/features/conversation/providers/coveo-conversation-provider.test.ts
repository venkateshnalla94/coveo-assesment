import { afterEach, describe, expect, it, vi } from "vitest";

import { CoveoConversationProvider } from "@/features/conversation/providers/coveo-conversation-provider";
import { ConversationProviderError } from "@/features/conversation/providers/conversation-errors";

function sseResponse(frames: Array<{ event: string; data: unknown }>) {
  const encoder = new TextEncoder();
  const text = frames.map((frame) => `event: ${frame.event}\ndata: ${JSON.stringify(frame.data)}\n\n`).join("");

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/event-stream" }, status: 200 });
}

describe("CoveoConversationProvider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("dispatches onStep/onToken/onCitations and resolves with the session on done", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      sseResponse([
        { data: { stepName: "Searching" }, event: "step" },
        { data: { delta: "Hello" }, event: "token" },
        { data: { delta: " world" }, event: "token" },
        { data: { citations: [{ id: "c1", title: "A", url: "https://a.test" }] }, event: "citations" },
        { data: { answerGenerated: true, conversationId: "conv-1", conversationToken: "token-1" }, event: "done" },
      ]),
    );

    const onStep = vi.fn();
    const onToken = vi.fn();
    const onCitations = vi.fn();

    const result = await new CoveoConversationProvider().stream(
      { pageContext: undefined, q: "What is RoboMotion?", session: {} },
      { onCitations, onStep, onToken },
    );

    expect(onStep).toHaveBeenCalledWith("Searching");
    expect(onToken).toHaveBeenNthCalledWith(1, "Hello");
    expect(onToken).toHaveBeenNthCalledWith(2, " world");
    expect(onCitations).toHaveBeenCalledWith([{ id: "c1", title: "A", url: "https://a.test" }]);
    expect(result).toEqual({
      session: { conversationId: "conv-1", conversationToken: "token-1" },
      status: "answered",
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/coveo/conversation",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("resolves with no-answer status and still carries the conversation session forward", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      sseResponse([
        { data: { conversationId: "conv-1", conversationToken: "token-1" }, event: "no-answer" },
      ]),
    );

    const result = await new CoveoConversationProvider().stream(
      { q: "no answer please", session: {} },
      { onToken: vi.fn() },
    );

    expect(result).toEqual({
      session: { conversationId: "conv-1", conversationToken: "token-1" },
      status: "no-answer",
    });
  });

  it("throws a ConversationProviderError on an error frame", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(sseResponse([{ data: { message: "boom" }, event: "error" }]));

    await expect(
      new CoveoConversationProvider().stream({ q: "trigger error", session: {} }, { onToken: vi.fn() }),
    ).rejects.toThrow("boom");
  });

  it("throws when the HTTP response itself fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 502 }));

    await expect(
      new CoveoConversationProvider().stream({ q: "q", session: {} }, { onToken: vi.fn() }),
    ).rejects.toThrow(ConversationProviderError);
  });

  it("forwards the abort signal to fetch", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(sseResponse([{ data: {}, event: "no-answer" }]));
    const abortController = new AbortController();

    await new CoveoConversationProvider().stream(
      { q: "q", session: {} },
      { onToken: vi.fn() },
      { signal: abortController.signal },
    );

    expect(fetch).toHaveBeenCalledWith(
      "/api/coveo/conversation",
      expect.objectContaining({ signal: abortController.signal }),
    );
  });
});
