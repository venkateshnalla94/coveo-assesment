import type { TrendingItem } from "@/features/trending/models/trending-models";
import type { TrendingProvider } from "@/features/trending/providers/trending-provider";

export class CoveoContentTrendingProvider implements TrendingProvider {
  constructor(private readonly query: string) {}

  async getTrendingContent(options: { signal?: AbortSignal } = {}): Promise<TrendingItem[]> {
    const response = await fetch("/api/coveo/content/search", {
      body: JSON.stringify({ numberOfResults: 4, query: this.query }),
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: options.signal,
    });

    if (!response.ok) {
      throw new Error("Technical resources could not be loaded.");
    }

    const body = (await response.json().catch(() => null)) as { items?: TrendingItem[] } | null;
    return body?.items ?? [];
  }
}
