import type { GenerativeAnswer } from "@/features/generative/models/generative-models";
import type { GenerativeProvider } from "@/features/generative/providers/generative-provider";
import { GenerativeProviderError } from "@/features/generative/providers/generative-errors";

export type MockGenerativeBehavior = "answer" | "no-answer" | "error" | "delayed-answer";

export class MockGenerativeProvider implements GenerativeProvider {
  constructor(
    private readonly options: {
      behavior?: MockGenerativeBehavior;
      delayMs?: number;
    } = {},
  ) {}

  async generate(query: string): Promise<GenerativeAnswer | null> {
    const trimmedQuery = query.trim();
    const behavior = getBehavior(trimmedQuery, this.options.behavior);

    if (this.options.delayMs || behavior === "delayed-answer") {
      await wait(this.options.delayMs ?? 80);
    }

    if (behavior === "error") {
      throw new GenerativeProviderError("Mock generative provider failed for this query.");
    }

    if (!trimmedQuery || behavior === "no-answer") {
      return null;
    }

    return {
      id: `mock-ga-${slugify(trimmedQuery)}`,
      query: trimmedQuery,
      answer:
        "Fixture-backed summary: start with a scoped transformation goal, connect it to measurable customer outcomes, then use search analytics to identify the content and support gaps slowing adoption.",
      citations: [
        {
          id: "mock-citation-guide",
          title: "The Ultimate Guide to Digital Transformation",
          url: "https://www.coveo.com/en/resources/guides/digital-transformation",
          source: "Fixture knowledge base",
          excerpt:
            "Defines the core transformation practices used as fixture evidence for the sample answer.",
        },
        {
          id: "mock-citation-roadmap",
          title: "Digital Transformation Roadmap",
          url: "https://www.coveo.com/en/resources/roadmaps/digital-transformation",
          source: "Fixture knowledge base",
          excerpt:
            "Describes phased planning, stakeholder alignment, and measurement checkpoints.",
        },
      ],
      generatedAt: "2026-01-01T00:00:00.000Z",
    };
  }
}

function getBehavior(query: string, configuredBehavior?: MockGenerativeBehavior) {
  if (configuredBehavior) {
    return configuredBehavior;
  }

  const normalizedQuery = query.toLowerCase();

  if (normalizedQuery.includes("error")) {
    return "error";
  }

  if (normalizedQuery.includes("no answer") || normalizedQuery.includes("no-answer")) {
    return "no-answer";
  }

  return "answer";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function wait(delayMs: number) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, delayMs));
}
