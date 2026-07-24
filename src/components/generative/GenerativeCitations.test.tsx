import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GenerativeCitations } from "@/components/generative/GenerativeCitations";
import { AnalyticsProviderRoot, type AnalyticsProvider } from "@/features/analytics/analytics";

describe("GenerativeCitations", () => {
  afterEach(() => {
    cleanup();
  });


  it("renders an empty citation message", () => {
    render(<GenerativeCitations citations={[]} query="digital" />);

    expect(screen.getByText("No citations are available for this answer.")).toBeTruthy();
  });

  it("tracks valid citation clicks and renders invalid urls as text", async () => {
    const analyticsProvider: AnalyticsProvider = { track: vi.fn() };

    render(
      <AnalyticsProviderRoot enabled provider={analyticsProvider}>
        <GenerativeCitations
          citations={[
            { id: "c1", title: "Valid citation", url: "https://example.test/c1" },
            { id: "c2", title: "Invalid citation", url: "javascript:alert(1)" },
          ]}
          query="digital"
        />
      </AnalyticsProviderRoot>,
    );

    expect(screen.getByText("Valid citation")).toBeTruthy();
    await userEvent.click(screen.getAllByRole("link", { name: /Read more/ })[0]);

    expect(analyticsProvider.track).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "generative_citation_clicked",
        payload: expect.objectContaining({ citationId: "c1", destination: "external" }),
      }),
    );
    expect(screen.getAllByRole("link", { name: /Read more/ })).toHaveLength(1);
    expect(screen.getByText("Invalid citation")).toBeTruthy();
  });

  it("routes citations with a permanentId to the internal blog page", async () => {
    const analyticsProvider: AnalyticsProvider = { track: vi.fn() };

    render(
      <AnalyticsProviderRoot enabled provider={analyticsProvider}>
        <GenerativeCitations
          citations={[
            {
              id: "c3",
              title: "Indexed blog citation",
              url: "https://example.test/c3",
              permanentId: "abc123",
            },
          ]}
          query="digital"
        />
      </AnalyticsProviderRoot>,
    );

    const link = screen.getByRole("link", { name: /Read more/ });
    expect(link.getAttribute("href")).toBe("/blog/abc123");

    await userEvent.click(link);

    expect(analyticsProvider.track).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "generative_citation_clicked",
        payload: expect.objectContaining({ citationId: "c3", destination: "internal" }),
      }),
    );
  });
});
