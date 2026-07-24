import type { GenerativeProvider } from "@/features/generative/providers/generative-provider";
import type { GenerativeAnswer } from "@/features/generative/models/generative-models";
import { GenerativeProviderError } from "@/features/generative/providers/generative-errors";

export class CoveoGenerativeProvider implements GenerativeProvider {
  async generate(query: string, options: { signal?: AbortSignal } = {}): Promise<GenerativeAnswer | null> {
    const response = await fetch("/api/coveo/generative/answer", {
      body: JSON.stringify({ query }),
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: options.signal,
    });

    if (!response.ok) {
      throw new GenerativeProviderError("Live Coveo generative answer request failed.");
    }

    const body = (await response.json().catch(() => null)) as { answer?: GenerativeAnswer | null } | null;
    return body?.answer ?? null;
  }
}
