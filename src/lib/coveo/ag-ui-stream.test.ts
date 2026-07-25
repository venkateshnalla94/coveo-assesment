import { describe, expect, it } from "vitest";

import {
  AgUiFrameReducer,
  createAgUiToContractTransformStream,
  parseAgUiBlock,
  splitSseBlocks,
} from "@/lib/coveo/ag-ui-stream";

function sse(payload: unknown) {
  return `data:${JSON.stringify(payload)}`;
}

describe("splitSseBlocks", () => {
  it("splits complete blocks and keeps a trailing partial block as remainder", () => {
    const { blocks, remainder } = splitSseBlocks("data:one\n\ndata:two\n\ndata:partial");

    expect(blocks).toEqual(["data:one", "data:two"]);
    expect(remainder).toBe("data:partial");
  });
});

describe("parseAgUiBlock", () => {
  it("parses a data: line into a typed event", () => {
    expect(parseAgUiBlock(sse({ runId: "r1", threadId: "t1", type: "RUN_STARTED" }))).toEqual({
      runId: "r1",
      threadId: "t1",
      type: "RUN_STARTED",
    });
  });

  it("ignores keepalive comment blocks", () => {
    expect(parseAgUiBlock(":keepalive")).toBeUndefined();
  });

  it("ignores malformed JSON", () => {
    expect(parseAgUiBlock("data:not-json")).toBeUndefined();
  });
});

describe("AgUiFrameReducer", () => {
  it("emits a step frame for known step names and ignores unknown ones", () => {
    const reducer = new AgUiFrameReducer();

    expect(reducer.ingest({ stepName: "Searching", type: "STEP_STARTED" })).toEqual([
      { data: { stepName: "Searching" }, event: "step" },
    ]);
    expect(reducer.ingest({ stepName: "Sleeping", type: "STEP_STARTED" })).toEqual([]);
  });

  it("accumulates token deltas across multiple TEXT_MESSAGE_CHUNK events", () => {
    const reducer = new AgUiFrameReducer();

    const frames = [
      reducer.ingest({ delta: "Hello", messageId: "m1", type: "TEXT_MESSAGE_CHUNK" }),
      reducer.ingest({ delta: " world", messageId: "m1", type: "TEXT_MESSAGE_CHUNK" }),
    ].flat();

    expect(frames).toEqual([
      { data: { delta: "Hello" }, event: "token" },
      { data: { delta: " world" }, event: "token" },
    ]);
  });

  it("maps CUSTOM citations into GenerativeCitation shape, dropping entries without an id/url", () => {
    const reducer = new AgUiFrameReducer();

    const frames = reducer.ingest({
      name: "citations",
      type: "CUSTOM",
      value: {
        citations: [
          {
            clickUri: "https://blog.example.test/a",
            fields: { filetype: "txt", source: "Blog" },
            id: "c1",
            permanentid: "perm-1",
            text: "excerpt",
            title: "Article A",
          },
          { title: "No id or url" },
        ],
      },
    });

    expect(frames).toEqual([
      {
        data: {
          citations: [
            {
              excerpt: "excerpt",
              filetype: "txt",
              id: "c1",
              permanentId: "perm-1",
              source: "Blog",
              title: "Article A",
              url: "https://blog.example.test/a",
            },
          ],
        },
        event: "citations",
      },
    ]);
  });

  it("emits no frame for a CUSTOM header event but remembers the conversation id/token for done", () => {
    const reducer = new AgUiFrameReducer();

    expect(reducer.ingest({ runId: "r1", threadId: "conv-1", type: "RUN_STARTED" })).toEqual([]);
    expect(
      reducer.ingest({ name: "header", type: "CUSTOM", value: { conversationToken: "token-1" } }),
    ).toEqual([]);
    expect(reducer.ingest({ result: { completionReason: "ANSWERED" }, type: "RUN_FINISHED" })).toEqual([
      {
        data: { answerGenerated: true, conversationId: "conv-1", conversationToken: "token-1" },
        event: "done",
      },
    ]);
  });

  it("emits a no-answer frame that still carries the conversation id/token, so the thread can continue", () => {
    const reducer = new AgUiFrameReducer();
    reducer.ingest({ runId: "r1", threadId: "conv-1", type: "RUN_STARTED" });
    reducer.ingest({ name: "header", type: "CUSTOM", value: { conversationToken: "token-1" } });

    expect(reducer.ingest({ result: { completionReason: "NOT_ANSWERED" }, type: "RUN_FINISHED" })).toEqual([
      { data: { conversationId: "conv-1", conversationToken: "token-1" }, event: "no-answer" },
    ]);
  });

  it("emits an error frame for RUN_ERROR", () => {
    const reducer = new AgUiFrameReducer();

    expect(reducer.ingest({ message: "boom", type: "RUN_ERROR" })).toEqual([
      { data: { message: "boom" }, event: "error" },
    ]);
  });

  it("ignores unrecognized event types", () => {
    const reducer = new AgUiFrameReducer();

    expect(reducer.ingest({ type: "TOOL_CALL_START" })).toEqual([]);
  });
});

describe("createAgUiToContractTransformStream", () => {
  it("re-encodes a full AG-UI turn into the step/token/citations/done contract, across chunk boundaries", async () => {
    const encoder = new TextEncoder();
    const events = [
      { runId: "r1", threadId: "conv-1", type: "RUN_STARTED" },
      { name: "header", type: "CUSTOM", value: { conversationToken: "token-1" } },
      { stepName: "Searching", type: "STEP_STARTED" },
      { stepName: "Answering", type: "STEP_STARTED" },
      { delta: "Hi", messageId: "m1", type: "TEXT_MESSAGE_CHUNK" },
      {
        name: "citations",
        type: "CUSTOM",
        value: { citations: [{ clickUri: "https://a.test", id: "c1", title: "A" }] },
      },
      { result: { completionReason: "ANSWERED" }, type: "RUN_FINISHED" },
    ];

    const fullText = events.map((event) => `data:${JSON.stringify(event)}\n\n`).join("");
    // Split mid-block to prove buffering across chunk boundaries works.
    const splitIndex = Math.floor(fullText.length / 2);
    const chunks = [fullText.slice(0, splitIndex), fullText.slice(splitIndex)];

    const upstream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    });

    const transformed = upstream.pipeThrough(createAgUiToContractTransformStream());
    const reader = transformed.getReader();
    const decoder = new TextDecoder();
    let output = "";

    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      output += decoder.decode(value);
    }

    expect(output).toContain('event: step\ndata: {"stepName":"Searching"}');
    expect(output).toContain('event: token\ndata: {"delta":"Hi"}');
    expect(output).toContain('event: citations\ndata:');
    expect(output).toContain(
      'event: done\ndata: {"answerGenerated":true,"conversationId":"conv-1","conversationToken":"token-1"}',
    );
  });
});
