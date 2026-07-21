import type { GenerativeAnswer } from "@/features/generative/models/generative-models";

export interface GenerativeProvider {
  generate(query: string): Promise<GenerativeAnswer | null>;
}
