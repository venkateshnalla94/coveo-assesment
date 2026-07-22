export type TechnicalResourceType = "article" | "documentation" | "video" | "community";

export interface TrendingItem {
  id: string;
  rank: number;
  title: string;
  url: string;
  type?: TechnicalResourceType;
  viewCount?: number;
  trendPercentage?: number;
  reason?: string;
  timeWindow?: string;
}
