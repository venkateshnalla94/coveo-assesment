import { describe, expect, it } from "vitest";

import {
  ConversationConfigurationError,
  ConversationProviderError,
  getFriendlyConversationError,
} from "@/features/conversation/providers/conversation-errors";

describe("conversation errors", () => {
  it("names each error class", () => {
    expect(new ConversationConfigurationError().name).toBe("ConversationConfigurationError");
    expect(new ConversationProviderError().name).toBe("ConversationProviderError");
  });

  it("returns a configuration-specific friendly message for ConversationConfigurationError", () => {
    expect(getFriendlyConversationError(new ConversationConfigurationError())).toBe(
      "The conversational agent is not configured for this environment.",
    );
  });

  it("returns a generic friendly message for any other error", () => {
    expect(getFriendlyConversationError(new ConversationProviderError("boom"))).toBe(
      "The conversational agent could not respond. Try again.",
    );
    expect(getFriendlyConversationError("not an error")).toBe(
      "The conversational agent could not respond. Try again.",
    );
  });
});
