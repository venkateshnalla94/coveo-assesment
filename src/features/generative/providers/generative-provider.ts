import type { GenerativeAnswer } from "@/features/generative/models/generative-models";

export interface GenerativeProvider {
  generate(query: string, options?: { signal?: AbortSignal }): Promise<GenerativeAnswer | null>;
}
