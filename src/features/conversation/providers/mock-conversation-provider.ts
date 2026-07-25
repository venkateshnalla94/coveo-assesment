import type {
  ConversationProvider,
  ConversationStreamCallbacks,
  ConversationStreamInput,
  ConversationStreamResult,
} from "@/features/conversation/providers/conversation-provider";
import { ConversationProviderError } from "@/features/conversation/providers/conversation-errors";

export type MockConversationBehavior = "answer" | "no-answer" | "error" | "delayed-answer";

const MOCK_ANSWER =
  "Fixture-backed response: RoboMotion arms pair a 22-bit absolute encoder with EtherCAT force/torque sensing for sub-millimeter TCP accuracy.";

export class MockConversationProvider implements ConversationProvider {
  constructor(
    private readonly options: {
      answer?: string;
      behavior?: MockConversationBehavior;
      delayMs?: number;
    } = {},
  ) {}

  async stream(
    input: ConversationStreamInput,
    callbacks: ConversationStreamCallbacks,
  ): Promise<ConversationStreamResult> {
    const trimmedQuery = input.q.trim();
    const behavior = getBehavior(trimmedQuery, this.options.behavior);

    if (this.options.delayMs || behavior === "delayed-answer") {
      await wait(this.options.delayMs ?? 80);
    }

    if (behavior === "error") {
      throw new ConversationProviderError("Mock conversation provider failed for this query.");
    }

    if (!trimmedQuery || behavior === "no-answer") {
      return { session: input.session, status: "no-answer" };
    }

    callbacks.onStep?.("Searching");
    callbacks.onStep?.("Thinking");
    callbacks.onStep?.("Answering");

    const answer = this.options.answer ?? MOCK_ANSWER;
    for (const word of answer.split(" ")) {
      callbacks.onToken(`${word} `);
    }

    callbacks.onCitations?.([
      {
        excerpt: "Fixture citation used for offline/demo mode.",
        id: "mock-conversation-citation",
        source: "Fixture knowledge base",
        title: "RoboMotion Technical Reference",
        url: "https://www.coveo.com/en/resources/guides/digital-transformation",
      },
    ]);

    return {
      session: {
        conversationId: input.session.conversationId ?? "mock-conversation",
        conversationToken: "mock-conversation-token",
      },
      status: "answered",
    };
  }
}

function getBehavior(query: string, configuredBehavior?: MockConversationBehavior) {
  if (configuredBehavior) {
    return configuredBehavior;
  }

  const normalizedQuery = query.toLowerCase();

  if (normalizedQuery.includes("error")) {
    return "error";
  }

  if (normalizedQuery.includes("no answer") || normalizedQuery.includes("no-answer")) {
    return "no-answer";
  }

  return "answer";
}

function wait(delayMs: number) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, delayMs));
}
