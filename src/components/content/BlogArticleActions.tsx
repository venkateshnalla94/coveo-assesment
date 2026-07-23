"use client";

import { ExternalLink } from "lucide-react";
import { useEffect } from "react";

import { AnalyticsProviderRoot, ConsoleAnalyticsProvider, useAnalytics } from "@/features/analytics/analytics";
import type { TrendingItem } from "@/features/trending/models/trending-models";
import { getSafeTrendingUrl } from "@/features/trending/services/trending-urls";

const consoleAnalyticsProvider = new ConsoleAnalyticsProvider();

export function BlogArticleActions({ item }: { item: TrendingItem }) {
  return (
    <AnalyticsProviderRoot enabled provider={consoleAnalyticsProvider}>
      <BlogArticleActionsContent item={item} />
    </AnalyticsProviderRoot>
  );
}

function BlogArticleActionsContent({ item }: { item: TrendingItem }) {
  const analytics = useAnalytics();
  const safeUrl = getSafeTrendingUrl(item);

  useEffect(() => {
    analytics.track("trending_article_opened", { itemId: item.id, title: item.title });
    // Track only once per mounted article, not on every analytics/item identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  if (safeUrl === "#") {
    return null;
  }

  return (
    <div className="blog-source-link">
      <a
        href={safeUrl}
        onClick={() => analytics.track("trending_source_visited", { itemId: item.id, url: safeUrl })}
        rel="noreferrer"
        target="_blank"
      >
        View original source
        <ExternalLink aria-hidden="true" size={15} />
      </a>
    </div>
  );
}
