import type {
  GenerativeAnswer,
  GenerativeState,
} from "@/features/generative/models/generative-models";

export type GenerativeStateAction =
  | { type: "requested"; query: string }
  | { type: "streamed"; query: string; partialAnswer: string; citations: GenerativeAnswer["citations"] }
  | { type: "completed"; answer: GenerativeAnswer }
  | { type: "no-answer"; query: string }
  | { type: "failed"; query: string; message: string }
  | { type: "reset" };

export function generativeStateReducer(
  _state: GenerativeState,
  action: GenerativeStateAction,
): GenerativeState {
  switch (action.type) {
    case "requested":
      return { status: "loading", query: action.query };
    case "streamed":
      return {
        status: "streaming",
        query: action.query,
        partialAnswer: action.partialAnswer,
        citations: action.citations,
      };
    case "completed":
      return { status: "complete", data: action.answer };
    case "no-answer":
      return { status: "no-answer", query: action.query };
    case "failed":
      return { status: "error", query: action.query, message: action.message };
    case "reset":
      return { status: "idle" };
  }
}

export function getFriendlyGenerativeError(error: unknown) {
  if (error instanceof Error && error.name === "GenerativeConfigurationError") {
    return "Generative answers are not configured for this environment.";
  }

  if (error instanceof Error && error.name === "GenerativeTimeoutError") {
    return "The answer took too long to generate. Try again.";
  }

  return "The generated answer could not be loaded. Try again.";
}
