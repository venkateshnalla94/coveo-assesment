import type { TrendingItem } from "@/features/trending/models/trending-models";

export interface TrendingProvider {
  getTrendingContent(options?: { signal?: AbortSignal }): Promise<TrendingItem[]>;
}
