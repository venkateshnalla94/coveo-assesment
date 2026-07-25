export class ConversationConfigurationError extends Error {
  constructor(message = "The conversational agent is not configured for this environment.") {
    super(message);
    this.name = "ConversationConfigurationError";
  }
}

export class ConversationProviderError extends Error {
  constructor(message = "The conversational agent provider failed.") {
    super(message);
    this.name = "ConversationProviderError";
  }
}

export function getFriendlyConversationError(error: unknown) {
  if (error instanceof Error && error.name === "ConversationConfigurationError") {
    return "The conversational agent is not configured for this environment.";
  }

  return "The conversational agent could not respond. Try again.";
}
