import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import {
  AnalyticsProviderRoot,
  createSearchAnalyticsPayload,
  useAnalytics,
  type AnalyticsEvent,
  type AnalyticsProvider,
} from "@/features/analytics/analytics";

describe("analytics", () => {
  it("adds timestamps centrally and omits events when disabled", () => {
    const provider: AnalyticsProvider = { track: vi.fn() };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AnalyticsProviderRoot enabled provider={provider}>
        {children}
      </AnalyticsProviderRoot>
    );
    const { result } = renderHook(() => useAnalytics(), { wrapper });

    result.current.track("search_submitted", { query: "digital" });

    expect(provider.track).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "search_submitted",
        payload: { query: "digital" },
        timestamp: expect.any(String),
      }) satisfies Partial<AnalyticsEvent>,
    );

    const disabledProvider: AnalyticsProvider = { track: vi.fn() };
    const disabledWrapper = ({ children }: { children: ReactNode }) => (
      <AnalyticsProviderRoot enabled={false} provider={disabledProvider}>
        {children}
      </AnalyticsProviderRoot>
    );
    const disabledHook = renderHook(() => useAnalytics(), { wrapper: disabledWrapper });
    disabledHook.result.current.track("search_submitted");

    expect(disabledProvider.track).not.toHaveBeenCalled();
  });

  it("centralizes safe search payload construction", () => {
    expect(
      createSearchAnalyticsPayload({
        position: 2,
        query: "",
        resultId: "r1",
        type: "article",
      }),
    ).toEqual({ position: 2, resultId: "r1", type: "article" });
  });
});
