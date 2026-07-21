import { ArrowRight, Search, Sparkles } from "lucide-react";

import { TrendingContent } from "@/components/content/TrendingContent";
import type { TrendingProvider } from "@/features/trending/providers/trending-provider";
import type { SearchFeatureFlags } from "@/lib/features/search-feature-flags";

export type SearchInsightsContent = {
  popularContent: {
    items: Array<{
      href: string;
      metric: string;
      title: string;
    }>;
    title: string;
  };
  relatedQueries: {
    items: string[];
    title: string;
  };
  topic: {
    actionLabel: string;
    body: string;
    href: string;
    title: string;
  };
};

export function SearchInsightsRail({
  content,
  featureFlags,
  trendingProvider,
}: {
  content: SearchInsightsContent;
  featureFlags: Pick<
    SearchFeatureFlags,
    "enablePopularContent" | "enableRelatedQueries" | "enableTopicInsight" | "enableTrendingContent"
  >;
  trendingProvider: TrendingProvider;
}) {
  return (
    <aside className="insights-rail" aria-label="Search insights">
      {featureFlags.enableTopicInsight ? (
        <section className="insight-card">
          <div className="insight-card-title">
            <Sparkles aria-hidden="true" size={18} />
            <h2>{content.topic.title}</h2>
          </div>
          <p>{content.topic.body}</p>
          <a href={content.topic.href}>
            {content.topic.actionLabel}
            <ArrowRight aria-hidden="true" size={16} />
          </a>
        </section>
      ) : null}

      {featureFlags.enableRelatedQueries ? (
        <section className="insight-card">
          <div className="insight-card-title">
            <Search aria-hidden="true" size={18} />
            <h2>{content.relatedQueries.title}</h2>
          </div>
          <ul className="query-list">
            {content.relatedQueries.items.map((query) => (
              <li key={query}>
                <a href="#">{query}</a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <TrendingContent
        enabled={featureFlags.enablePopularContent && featureFlags.enableTrendingContent}
        provider={trendingProvider}
      />
    </aside>
  );
}
