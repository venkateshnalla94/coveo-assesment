"use client";

import { CheckCircle2, Sparkles } from "lucide-react";
import { useMemo } from "react";

import { TrendingContent } from "@/components/content/TrendingContent";
import { CoveoContentTrendingProvider } from "@/features/trending/providers/coveo-content-trending-provider";

export function ProductRightRail({
  query,
}: {
  query: string;
}) {
  const trendingProvider = useMemo(() => new CoveoContentTrendingProvider(query), [query]);

  return (
    <aside
      className="insights-rail product-right-rail"
      aria-label="Product guidance and resources"
    >
      <section className="insight-card guidance-summary">
        <div className="insight-card-title">
          <Sparkles aria-hidden="true" size={18} />
          <h2>AI Product Guidance</h2>
        </div>
        <ul>
          <li>
            <CheckCircle2 aria-hidden="true" size={15} />
            Confirm product category and application fit.
          </li>
          <li>
            <CheckCircle2 aria-hidden="true" size={15} />
            Check compatible robot series before comparing.
          </li>
          <li>
            <CheckCircle2 aria-hidden="true" size={15} />
            Treat RGA guidance as technical research, not product selection.
          </li>
        </ul>
      </section>

      <TrendingContent
        description={`Guides and technical resources related to "${query}".`}
        enabled
        provider={trendingProvider}
        title="Related Technical Resources"
      />
    </aside>
  );
}
