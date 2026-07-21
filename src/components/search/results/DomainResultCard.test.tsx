import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

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

  it("uses safe fallback urls and emits selection context", async () => {
    const onSelect = vi.fn();
    const result = {
      ...resultFor("product"),
      displayUrl: undefined,
      url: "javascript:alert(1)",
    };

    render(<DomainResultCard onSelect={onSelect} position={3} query="digital" result={result} />);

    expect(screen.getByText("Unavailable URL")).toBeTruthy();
    await userEvent.click(screen.getByRole("link", { name: /product result/ }));

    expect(onSelect).toHaveBeenCalledWith(result, 3, "digital");
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
