import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { GenerativeCitations } from "@/components/generative/GenerativeCitations";
import { AnalyticsProviderRoot, type AnalyticsProvider } from "@/features/analytics/analytics";

describe("GenerativeCitations", () => {
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

    await userEvent.click(screen.getByRole("link", { name: /Valid citation/ }));

    expect(analyticsProvider.track).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "generative_citation_clicked",
        payload: expect.objectContaining({ citationId: "c1" }),
      }),
    );
    expect(screen.queryByRole("link", { name: /Invalid citation/ })).toBeNull();
    expect(screen.getByText("Invalid citation")).toBeTruthy();
  });
});
