import type { GenerativeCitation } from "@/features/generative/models/generative-models";
import type {
  ConversationProvider,
  ConversationStreamCallbacks,
  ConversationStreamInput,
  ConversationStreamResult,
} from "@/features/conversation/providers/conversation-provider";
import { ConversationProviderError } from "@/features/conversation/providers/conversation-errors";
import type { ConversationStepName } from "@/features/conversation/models/conversation-models";

function parseContractBlock(block: string): { event: string; data: unknown } | undefined {
  const lines = block.split(/\r?\n/);
  const event = lines.find((line) => line.startsWith("event:"))?.slice(6).trim();
  const dataLine = lines.find((line) => line.startsWith("data:"))?.slice(5).trim();

  if (!event || !dataLine) {
    return undefined;
  }

  try {
    return { data: JSON.parse(dataLine) as unknown, event };
  } catch {
    return undefined;
  }
}

export class CoveoConversationProvider implements ConversationProvider {
  async stream(
    input: ConversationStreamInput,
    callbacks: ConversationStreamCallbacks,
    options: { signal?: AbortSignal } = {},
  ): Promise<ConversationStreamResult> {
    const response = await fetch("/api/coveo/conversation", {
      body: JSON.stringify({
        conversationId: input.session.conversationId,
        conversationToken: input.session.conversationToken,
        pageContext: input.pageContext,
        q: input.q,
      }),
      cache: "no-store",
      headers: {
        Accept: "text/event-stream",
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: options.signal,
    });

    if (!response.ok || !response.body) {
      throw new ConversationProviderError("The conversational agent request failed.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let result: ConversationStreamResult | undefined;

    while (!result) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split(/\r?\n\r?\n/);
      buffer = parts.pop() ?? "";

      for (const block of parts) {
        result = handleBlock(block, callbacks) ?? result;

        if (result) {
          break;
        }
      }
    }

    if (!result) {
      throw new ConversationProviderError("The conversational agent stream ended unexpectedly.");
    }

    return result;
  }
}

function handleBlock(
  block: string,
  callbacks: ConversationStreamCallbacks,
): ConversationStreamResult | undefined {
  const parsed = parseContractBlock(block);

  if (!parsed) {
    return undefined;
  }

  const data = (parsed.data && typeof parsed.data === "object" ? parsed.data : {}) as Record<string, unknown>;

  switch (parsed.event) {
    case "step": {
      const stepName = data.stepName;
      if (typeof stepName === "string") {
        callbacks.onStep?.(stepName as ConversationStepName);
      }
      return undefined;
    }
    case "token": {
      const delta = data.delta;
      if (typeof delta === "string") {
        callbacks.onToken(delta);
      }
      return undefined;
    }
    case "citations": {
      const citations = data.citations;
      if (Array.isArray(citations)) {
        callbacks.onCitations?.(citations as GenerativeCitation[]);
      }
      return undefined;
    }
    case "done": {
      return {
        session: {
          conversationId: typeof data.conversationId === "string" ? data.conversationId : undefined,
          conversationToken: typeof data.conversationToken === "string" ? data.conversationToken : undefined,
        },
        status: "answered",
      };
    }
    case "no-answer": {
      return {
        session: {
          conversationId: typeof data.conversationId === "string" ? data.conversationId : undefined,
          conversationToken: typeof data.conversationToken === "string" ? data.conversationToken : undefined,
        },
        status: "no-answer",
      };
    }
    case "error": {
      const message = typeof data.message === "string" ? data.message : undefined;
      throw new ConversationProviderError(message);
    }
    default:
      return undefined;
  }
}
