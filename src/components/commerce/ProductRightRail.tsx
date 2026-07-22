"use client";

import { CheckCircle2, Sparkles } from "lucide-react";
import { useMemo } from "react";

import { GenerativeAnswer } from "@/components/generative/GenerativeAnswer";
import { InMemoryFeedbackProvider } from "@/features/generative/providers/feedback-provider";
import { CoveoGenerativeProvider } from "@/features/generative/providers/coveo-generative-provider";
import { CoveoContentTrendingProvider } from "@/features/trending/providers/coveo-content-trending-provider";
import { TrendingContent } from "@/components/content/TrendingContent";

export function ProductRightRail({
  query,
}: {
  query: string;
}) {
  const generativeProvider = useMemo(() => new CoveoGenerativeProvider(), []);
  const feedbackProvider = useMemo(() => new InMemoryFeedbackProvider(), []);
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

      <GenerativeAnswer
        feedbackProvider={feedbackProvider}
        featureFlags={{
          enableGenerativeAnswers: true,
          enableGenerativeCitations: true,
          enableGenerativeDisclaimer: true,
          enableGenerativeFeedback: true,
          enableGenerativeStreaming: true,
        }}
        provider={generativeProvider}
        query={query}
      />

      <TrendingContent
        description="Live Search API content for product evaluation and robotics planning."
        enabled
        provider={trendingProvider}
        title="Technical Resources"
      />
    </aside>
  );
}
