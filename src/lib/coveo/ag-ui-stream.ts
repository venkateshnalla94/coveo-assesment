import type { GenerativeCitation } from "@/features/generative/models/generative-models";

export type AgUiEvent =
  | { type: "RUN_STARTED"; runId: string; threadId: string }
  | { type: "CUSTOM"; name: "header"; value: { conversationId?: string; conversationToken?: string } }
  | { type: "CUSTOM"; name: "citations"; value: { citations: unknown[] } }
  | { type: "CUSTOM"; name: string; value: unknown }
  | { type: "STEP_STARTED"; stepName: string }
  | { type: "STEP_FINISHED"; stepName: string }
  | { type: "TEXT_MESSAGE_CHUNK"; messageId: string; delta: string }
  | { type: "RUN_FINISHED"; runId: string; threadId: string; result?: { completionReason?: string } }
  | { type: "RUN_ERROR"; code?: string; message?: string }
  | { type: string; [key: string]: unknown };

export type ConversationStepName = "Searching" | "Thinking" | "Answering";

export type ConversationOutgoingFrame =
  | { event: "step"; data: { stepName: ConversationStepName } }
  | { event: "token"; data: { delta: string } }
  | { event: "citations"; data: { citations: GenerativeCitation[] } }
  | { event: "done"; data: { answerGenerated: true; conversationId?: string; conversationToken?: string } }
  | { event: "no-answer"; data: { conversationId?: string; conversationToken?: string } }
  | { event: "error"; data: { message: string } };

const KNOWN_STEP_NAMES = new Set<ConversationStepName>(["Searching", "Thinking", "Answering"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Splits a growing text buffer into complete `\n\n`-delimited SSE blocks, keeping the trailing partial block. */
export function splitSseBlocks(buffer: string): { blocks: string[]; remainder: string } {
  const parts = buffer.split(/\r?\n\r?\n/);
  const remainder = parts.pop() ?? "";
  return { blocks: parts, remainder };
}

/** Extracts and JSON-parses the `data:` payload from one SSE block; `:keepalive` comment blocks yield undefined. */
export function parseAgUiBlock(block: string): AgUiEvent | undefined {
  const dataLine = block
    .split(/\r?\n/)
    .find((line) => line.startsWith("data:"));

  if (!dataLine) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(dataLine.slice(5).trim()) as unknown;
    return isRecord(parsed) && typeof parsed.type === "string" ? (parsed as AgUiEvent) : undefined;
  } catch {
    return undefined;
  }
}

function mapCitation(raw: unknown): GenerativeCitation | undefined {
  if (!isRecord(raw)) {
    return undefined;
  }

  const id = typeof raw.id === "string" ? raw.id : typeof raw.uri === "string" ? raw.uri : undefined;
  const url = typeof raw.clickUri === "string" ? raw.clickUri : typeof raw.uri === "string" ? raw.uri : undefined;
  const fields = isRecord(raw.fields) ? raw.fields : {};

  if (!id || !url) {
    return undefined;
  }

  return {
    excerpt: typeof raw.text === "string" ? raw.text : undefined,
    filetype: typeof fields.filetype === "string" ? fields.filetype : undefined,
    id,
    permanentId: typeof raw.permanentid === "string" ? raw.permanentid : undefined,
    source: typeof fields.source === "string" ? fields.source : typeof raw.source === "string" ? raw.source : undefined,
    title: typeof raw.title === "string" ? raw.title : url,
    url,
  };
}

/**
 * Reduces the AG-UI event sequence from a Search Agent turn into our smaller, stable contract.
 * Stateful across one turn: tracks the conversation id/token needed to continue the thread on
 * the next `/follow-up` call, since the browser (not this server route) persists them.
 */
export class AgUiFrameReducer {
  private conversationId: string | undefined;
  private conversationToken: string | undefined;

  ingest(event: AgUiEvent): ConversationOutgoingFrame[] {
    switch (event.type) {
      case "RUN_STARTED": {
        if ("threadId" in event && typeof event.threadId === "string") {
          this.conversationId = event.threadId;
        }
        return [];
      }
      case "CUSTOM": {
        if (event.name === "header" && isRecord(event.value)) {
          const token = event.value.conversationToken;
          if (typeof token === "string") {
            this.conversationToken = token;
          }
          return [];
        }

        if (event.name === "citations" && isRecord(event.value) && Array.isArray(event.value.citations)) {
          // The agent can cite the same id twice in one payload (different chunks of the same
          // article); de-dupe here so the UI never has to render two list items with one key.
          const byId = new Map<string, GenerativeCitation>();
          for (const raw of event.value.citations) {
            const citation = mapCitation(raw);
            if (citation) {
              byId.set(citation.id, citation);
            }
          }
          const citations = Array.from(byId.values());
          return citations.length > 0 ? [{ data: { citations }, event: "citations" }] : [];
        }

        return [];
      }
      case "STEP_STARTED": {
        const stepName = "stepName" in event ? event.stepName : undefined;
        return typeof stepName === "string" && KNOWN_STEP_NAMES.has(stepName as ConversationStepName)
          ? [{ data: { stepName: stepName as ConversationStepName }, event: "step" }]
          : [];
      }
      case "TEXT_MESSAGE_CHUNK": {
        const delta = "delta" in event ? event.delta : undefined;
        return typeof delta === "string" && delta.length > 0 ? [{ data: { delta }, event: "token" }] : [];
      }
      case "RUN_FINISHED": {
        const completionReason = "result" in event && isRecord(event.result) ? event.result.completionReason : undefined;

        if (completionReason === "ANSWERED") {
          return [
            {
              data: {
                answerGenerated: true,
                conversationId: this.conversationId,
                conversationToken: this.conversationToken,
              },
              event: "done",
            },
          ];
        }

        // The Search Agent keeps the thread alive even when a turn is NOT_ANSWERED — verified
        // live: a `/follow-up` call with this turn's conversationId/token still succeeds. Carry
        // them so the browser can continue the same thread instead of starting a fresh one.
        return [
          {
            data: { conversationId: this.conversationId, conversationToken: this.conversationToken },
            event: "no-answer",
          },
        ];
      }
      case "RUN_ERROR": {
        const message = "message" in event && typeof event.message === "string" ? event.message : "The conversational agent failed.";
        return [{ data: { message }, event: "error" }];
      }
      default:
        return [];
    }
  }
}

export function encodeContractFrame(frame: ConversationOutgoingFrame): string {
  return `event: ${frame.event}\ndata: ${JSON.stringify(frame.data)}\n\n`;
}

/** Pipes an upstream AG-UI SSE `ReadableStream` into our re-encoded `step`/`token`/`citations`/`done`/`no-answer`/`error` contract. */
export function createAgUiToContractTransformStream(): TransformStream<Uint8Array, Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const reducer = new AgUiFrameReducer();
  let buffer = "";

  return new TransformStream<Uint8Array, Uint8Array>({
    flush(controller) {
      const { blocks } = splitSseBlocks(`${buffer}\n\n`);
      for (const block of blocks) {
        emitBlock(block, reducer, controller, encoder);
      }
    },
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      const { blocks, remainder } = splitSseBlocks(buffer);
      buffer = remainder;

      for (const block of blocks) {
        emitBlock(block, reducer, controller, encoder);
      }
    },
  });
}

function emitBlock(
  block: string,
  reducer: AgUiFrameReducer,
  controller: TransformStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
) {
  const event = parseAgUiBlock(block);

  if (!event) {
    return;
  }

  for (const frame of reducer.ingest(event)) {
    controller.enqueue(encoder.encode(encodeContractFrame(frame)));
  }
}
