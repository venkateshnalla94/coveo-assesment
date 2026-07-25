import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const originalEnv = { ...process.env };

function clearCoveoEnv() {
  for (const key of Object.keys(process.env)) {
    if (key.startsWith("COVEO_")) {
      delete process.env[key];
    }
  }
}

function setRequiredEnv() {
  process.env.COVEO_ORGANIZATION_ID = "example-org";
  process.env.COVEO_PLATFORM_API_KEY = "test-platform-key";
  process.env.COVEO_SEARCH_AGENT_ID = "agent-1";
}

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/coveo/conversation", {
    body: JSON.stringify(body),
    method: "POST",
  });
}

function sseUpstream(frames: Array<{ type: string; [key: string]: unknown }>) {
  const encoder = new TextEncoder();
  const text = frames.map((frame) => `data:${JSON.stringify(frame)}\n\n`).join("");

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/event-stream" }, status: 200 });
}

beforeEach(() => {
  process.env = { ...originalEnv };
  clearCoveoEnv();
});

afterEach(() => {
  process.env = { ...originalEnv };
  vi.unstubAllGlobals();
});

describe("POST /api/coveo/conversation", () => {
  it("returns a no-store 500 without calling Coveo when required environment is missing", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(jsonRequest({ q: "hello" }));
    const body = (await response.json()) as { error?: string };

    expect(response.status).toBe(500);
    expect(response.headers.get("Cache-Control")).toBe("no-store, max-age=0");
    expect(body.error).toBe("The conversational agent is not configured.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns a 400 without calling Coveo when the question is empty", async () => {
    setRequiredEnv();
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(jsonRequest({ q: "   " }));

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("calls the head-answer endpoint when no conversation session is present", async () => {
    setRequiredEnv();
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      sseUpstream([{ result: { completionReason: "ANSWERED" }, type: "RUN_FINISHED" }]),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(jsonRequest({ q: "What is RoboMotion?" }));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example-org.org.coveo.com/api/v1/organizations/example-org/agents/agent-1/answer",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer test-platform-key" }),
        method: "POST",
      }),
    );

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(requestInit.body))).toEqual({ q: "What is RoboMotion?" });

    const text = await response.text();
    expect(text).toContain("event: done");
  });

  it("calls the follow-up endpoint and forwards the session when present", async () => {
    setRequiredEnv();
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      sseUpstream([{ result: { completionReason: "NOT_ANSWERED" }, type: "RUN_FINISHED" }]),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      jsonRequest({ conversationId: "conv-1", conversationToken: "token-1", q: "tell me more" }),
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example-org.org.coveo.com/api/v1/organizations/example-org/agents/agent-1/follow-up",
      expect.anything(),
    );

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(requestInit.body))).toEqual({
      conversationId: "conv-1",
      conversationToken: "token-1",
      q: "tell me more",
    });

    const text = await response.text();
    expect(text).toContain("event: no-answer");
  });

  it("returns a controlled 502 when the upstream response is not ok", async () => {
    setRequiredEnv();
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 404 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(jsonRequest({ q: "hello" }));
    const body = (await response.json()) as { error?: string };

    expect(response.status).toBe(502);
    expect(body.error).toBe("The conversational agent could not be reached.");
  });

  it("returns a controlled 502 when the upstream fetch throws", async () => {
    setRequiredEnv();
    const fetchMock = vi.fn<typeof fetch>().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(jsonRequest({ q: "hello" }));

    expect(response.status).toBe(502);
  });

  it("truncates overly long questions to 300 characters", async () => {
    setRequiredEnv();
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      sseUpstream([{ result: { completionReason: "ANSWERED" }, type: "RUN_FINISHED" }]),
    );
    vi.stubGlobal("fetch", fetchMock);

    const longQuestion = "a".repeat(400);
    await POST(jsonRequest({ q: longQuestion }));

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const payload = JSON.parse(String(requestInit.body)) as { q: string };
    expect(payload.q).toHaveLength(300);
  });
});
