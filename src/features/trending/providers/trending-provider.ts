import type { TrendingItem } from "@/features/trending/models/trending-models";

export interface TrendingProvider {
  getTrendingContent(): Promise<TrendingItem[]>;
}
