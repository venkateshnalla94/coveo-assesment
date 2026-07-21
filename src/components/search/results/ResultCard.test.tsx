import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ResultCard } from "@/components/search/results/ResultCard";

describe("ResultCard", () => {
  it("normalizes unsafe click URLs at the shared card boundary", () => {
    render(
      <ResultCard
        clickUri="javascript:alert(1)"
        meta={[]}
        printableUri="javascript:alert(1)"
        resultType="Web Page"
        tags={[]}
        title="Unsafe result"
      />,
    );

    const link = screen.getByRole("link", { name: "Unsafe result" });
    expect(link.getAttribute("href")).toBe("#");
    expect(link.getAttribute("target")).toBeNull();
  });
});
