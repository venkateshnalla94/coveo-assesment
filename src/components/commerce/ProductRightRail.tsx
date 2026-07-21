"use client";

import { CheckCircle2, Sparkles } from "lucide-react";
import { useMemo } from "react";

import { GenerativeAnswer } from "@/components/generative/GenerativeAnswer";
import { InMemoryFeedbackProvider } from "@/features/generative/providers/feedback-provider";
import { CoveoGenerativeProvider } from "@/features/generative/providers/coveo-generative-provider";
import { MockGenerativeProvider } from "@/features/generative/providers/mock-generative-provider";
import { CoveoContentTrendingProvider } from "@/features/trending/providers/coveo-content-trending-provider";
import { MockTrendingProvider } from "@/features/trending/providers/mock-trending-provider";
import { TrendingContent } from "@/components/content/TrendingContent";

const guidanceAnswer = {
  answer:
    "For robotic welding and automation searches, compare the application, compatible robot series, end-of-arm tooling, safety requirements, available price range, and support resources before shortlisting products. Treat product results and technical guidance as separate signals.",
  citations: [
    {
      excerpt: "Technical resource for robotic welding selection criteria.",
      id: "robotic-welding-guide",
      source: "RoboMotion technical resources",
      title: "Choosing the Right Robot for Welding Cells",
      url: "https://example.coveo.local/resources/robotic-welding-guide",
    },
    {
      excerpt: "Explains compatibility and cell-design considerations.",
      id: "compatibility-guide",
      source: "RoboMotion technical resources",
      title: "Robot Compatibility Planning Guide",
      url: "https://example.coveo.local/resources/compatibility-planning",
    },
  ],
  generatedAt: "2026-01-01T00:00:00.000Z",
};

const technicalResources = [
  {
    id: "resource-welding",
    rank: 1,
    reason: "Fixture resource for sample-mode technical research.",
    timeWindow: "Sample content",
    title: "Choosing the Right Robot for Welding Cells",
    type: "article" as const,
    url: "https://example.coveo.local/resources/robotic-welding-guide",
  },
  {
    id: "resource-payload",
    rank: 2,
    reason: "Fixture resource for product-evaluation criteria.",
    timeWindow: "Sample content",
    title: "Payload, Tooling, and Compatibility Planning",
    type: "documentation" as const,
    url: "https://example.coveo.local/resources/payload-compatibility",
  },
  {
    id: "resource-safety",
    rank: 3,
    reason: "Fixture resource for robot-cell safety planning.",
    timeWindow: "Sample content",
    title: "Robotic Welding Safety Best Practices",
    type: "article" as const,
    url: "https://example.coveo.local/resources/welding-safety",
  },
];

export function ProductRightRail({
  query,
  sampleMode,
}: {
  query: string;
  sampleMode: boolean;
}) {
  const generativeProvider = useMemo(
    () =>
      sampleMode
        ? new MockGenerativeProvider({
            answer: guidanceAnswer,
            delayMs: 20,
          })
        : new CoveoGenerativeProvider(),
    [sampleMode],
  );
  const feedbackProvider = useMemo(() => new InMemoryFeedbackProvider(), []);
  const trendingProvider = useMemo(
    () => (sampleMode ? new MockTrendingProvider(technicalResources) : new CoveoContentTrendingProvider(query)),
    [query, sampleMode],
  );

  return (
    <aside className="insights-rail product-right-rail" aria-label="Product guidance and resources">
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
          enableGenerativeStreaming: false,
        }}
        provider={generativeProvider}
        query={query}
      />

      <TrendingContent
        description={
          sampleMode
            ? "Fixture resources for sample-mode product evaluation."
            : "Live Search API content for product evaluation and robotics planning."
        }
        enabled
        provider={trendingProvider}
        title="Technical Resources"
      />
    </aside>
  );
}
