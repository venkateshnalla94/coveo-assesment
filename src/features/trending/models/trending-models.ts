import type { SearchResultType } from "@/features/search/models/search-models";

export interface TrendingItem {
  id: string;
  rank: number;
  title: string;
  url: string;
  type?: SearchResultType;
  viewCount?: number;
  trendPercentage?: number;
  reason?: string;
  timeWindow?: string;
}
