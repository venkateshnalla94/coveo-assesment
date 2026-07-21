import type { TrendingItem } from "@/features/trending/models/trending-models";
import type { TrendingProvider } from "@/features/trending/providers/trending-provider";

export class MockTrendingProvider implements TrendingProvider {
  constructor(private readonly items: TrendingItem[] = defaultTrendingItems) {}

  async getTrendingContent(): Promise<TrendingItem[]> {
    return this.items;
  }
}

export const defaultTrendingItems: TrendingItem[] = [
  {
    id: "trend-1",
    rank: 1,
    title: "The Ultimate Guide to Digital Transformation",
    url: "https://www.coveo.com/en/resources/guides/digital-transformation",
    type: "article",
    viewCount: 2300,
    trendPercentage: 18,
    reason: "Most viewed fixture article",
    timeWindow: "Last 7 days",
  },
  {
    id: "trend-2",
    rank: 2,
    title: "Digital Transformation Roadmap",
    url: "https://www.coveo.com/en/resources/roadmaps/digital-transformation",
    type: "documentation",
    viewCount: 1800,
    trendPercentage: 12,
    reason: "Rising fixture documentation",
    timeWindow: "Last 7 days",
  },
  {
    id: "trend-3",
    rank: 3,
    title: "AI and the Future of Work",
    url: "https://www.coveo.com/en/resources/articles/ai-future-of-work",
    type: "article",
    viewCount: 1600,
    trendPercentage: 9,
    reason: "Frequently opened after related queries",
    timeWindow: "Last 7 days",
  },
];
