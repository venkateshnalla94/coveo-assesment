import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TrendingContent } from "@/components/content/TrendingContent";
import { AnalyticsProviderRoot, type AnalyticsProvider } from "@/features/analytics/analytics";
import { MockTrendingProvider } from "@/features/trending/providers/mock-trending-provider";
import type { TrendingProvider } from "@/features/trending/providers/trending-provider";

function renderTrending(
  provider: TrendingProvider = new MockTrendingProvider(),
  analyticsProvider: AnalyticsProvider = { track: vi.fn() },
) {
  render(
    <AnalyticsProviderRoot enabled provider={analyticsProvider}>
      <TrendingContent enabled provider={provider} />
    </AnalyticsProviderRoot>,
  );

  return analyticsProvider;
}

describe("TrendingContent", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders ranked trending fixture content and tracks clicks", async () => {
    const analyticsProvider = renderTrending();

    const link = await screen.findByRole("link", { name: /Ultimate Guide/ });
    expect(screen.getByText("1")).toBeTruthy();

    await userEvent.click(link);
    expect(analyticsProvider.track).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "trending_content_clicked",
        payload: expect.objectContaining({ rank: 1 }),
      }),
    );
  });

  it("renders empty state", async () => {
    renderTrending(new MockTrendingProvider([]));

    expect(await screen.findByText("No trending content is available.")).toBeTruthy();
  });

  it("renders invalid and sparse trending items without links", async () => {
    renderTrending(
      new MockTrendingProvider([
        {
          id: "bad-url",
          rank: 1,
          title: "Sparse item",
          url: "not a url",
        },
      ]),
    );

    expect(await screen.findByText("Sparse item")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Sparse item" })).toBeNull();
    expect(screen.getByText("content")).toBeTruthy();
  });

  it("renders error state and nothing when disabled", async () => {
    const provider: TrendingProvider = {
      getTrendingContent: vi.fn().mockRejectedValue(new Error("failed")),
    };

    renderTrending(provider);
    expect(await screen.findByText("Trending content could not be loaded.")).toBeTruthy();

    cleanup();
    render(
      <AnalyticsProviderRoot enabled provider={{ track: vi.fn() }}>
        <TrendingContent enabled={false} provider={new MockTrendingProvider()} />
      </AnalyticsProviderRoot>,
    );
    expect(screen.queryByLabelText("Trending content")).toBeNull();
  });
});
