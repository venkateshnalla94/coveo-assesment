export interface GenerativeCitation {
  id: string;
  title: string;
  url: string;
  source?: string;
  excerpt?: string;
}

export interface GenerativeAnswer {
  id: string;
  query: string;
  answer: string;
  citations: GenerativeCitation[];
  generatedAt?: string;
}

export type GenerativeState =
  | { status: "idle" }
  | { status: "loading"; query: string }
  | { status: "complete"; data: GenerativeAnswer }
  | { status: "no-answer"; query: string }
  | { status: "error"; query: string; message: string };

export type GenerativeFeedbackValue = "helpful" | "not-helpful";

export type GenerativeFeedbackReason =
  | "incorrect"
  | "incomplete"
  | "outdated"
  | "not-relevant"
  | "other";

export interface GenerativeFeedbackInput {
  answerId: string;
  query: string;
  value: GenerativeFeedbackValue;
  reason?: GenerativeFeedbackReason;
}
