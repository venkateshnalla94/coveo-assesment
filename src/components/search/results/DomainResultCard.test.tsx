import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DomainResultCard } from "@/components/search/results/DomainResultCard";
import type { SearchResult, SearchResultType } from "@/features/search/models/search-models";

const variants: SearchResultType[] = ["article", "community", "documentation", "product", "video"];

describe("DomainResultCard", () => {
  it("renders all known variants and the default fallback", () => {
    const { rerender } = render(<DomainResultCard result={resultFor("article")} />);

    for (const variant of variants) {
      rerender(<DomainResultCard result={resultFor(variant)} />);
      expect(screen.getAllByText(labelFor(variant)).length).toBeGreaterThan(0);
    }

    rerender(<DomainResultCard result={resultFor("unknown" as never)} />);
    expect(screen.getAllByText("Content").length).toBeGreaterThan(0);
  });
});

function resultFor(type: SearchResultType): SearchResult {
  return {
    description: "Description",
    id: type,
    imageUrl: "https://example.test/image.png",
    title: `${type} result`,
    type,
    url: "https://example.test/result",
  };
}

function labelFor(type: SearchResultType) {
  return {
    article: "Article",
    community: "Community",
    documentation: "Documentation",
    product: "Product",
    video: "Video",
  }[type];
}
