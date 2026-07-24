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
  author?: string;
  publishedAt?: string;
  category?: string;
  tags?: string[];
  imageUrl?: string;
  wordCount?: number;
  /** Sanitized article body HTML. Only populated by a single-article fetch, never in list results. */
  body?: string;
  /** Additional product images beyond the hero. Only populated by a single-article fetch. */
  images?: string[];
}
