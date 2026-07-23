import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GenerativeAnswerContent } from "@/components/generative/GenerativeAnswerContent";
import { AnalyticsProviderRoot } from "@/features/analytics/analytics";
import type { GenerativeCitation } from "@/features/generative/models/generative-models";

const citations: GenerativeCitation[] = [
  {
    id: "citation-1",
    source: "Technical Resources",
    title: "Welding robotics guide",
    url: "https://example.test/welding",
  },
];

function renderContent({
  answer = "Short guidance.",
  compact = true,
}: {
  answer?: string;
  compact?: boolean;
} = {}) {
  render(
    <AnalyticsProviderRoot enabled provider={{ track: vi.fn() }}>
      <GenerativeAnswerContent answer={answer} citations={citations} compact={compact} query="welding arm" />
    </AnalyticsProviderRoot>,
  );
}

describe("GenerativeAnswerContent", () => {
  afterEach(() => {
    cleanup();
  });

  it("keeps citations out of the compact DOM until the modal citation tab opens", async () => {
    renderContent({
      answer:
        "The welding arm, or End-of-Arm Tooling, is a critical component in robotic welding systems with control parameters that affect weld quality and maintenance planning.",
    });

    expect(screen.getByText(/The welding arm/)).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Welding robotics guide/ })).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Read full guidance and citations" }));
    expect(screen.getByRole("dialog", { name: "AI Product Guidance" })).toBeTruthy();
    await userEvent.click(screen.getByRole("tab", { name: "Citations (1)" }));
    expect(screen.getByRole("link", { name: /Welding robotics guide/ })).toBeTruthy();
  });

  it("supports Escape close and restores the compact trigger", async () => {
    renderContent();

    await userEvent.click(screen.getByRole("button", { name: "Read full guidance and citations" }));
    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("dialog", { name: "AI Product Guidance" })).toBeNull();
    expect(screen.getByRole("button", { name: "Read full guidance and citations" })).toBeTruthy();
  });

  it("can render the full non-compact answer with citations", () => {
    renderContent({ compact: false });

    expect(screen.getByText("Short guidance.")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Welding robotics guide/ })).toBeTruthy();
  });

  it("shows a compact inline 'more' trigger with a full accessible name", () => {
    renderContent({
      answer:
        "The welding arm, or End-of-Arm Tooling, is a critical component in robotic welding systems with control parameters that affect weld quality and maintenance planning.",
    });

    const trigger = screen.getByRole("button", { name: "Read full guidance and citations" });
    expect(trigger.textContent).toBe("more");
    expect(trigger.tagName).toBe("BUTTON");
  });
});
