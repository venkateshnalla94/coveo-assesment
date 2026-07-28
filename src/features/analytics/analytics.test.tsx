import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import type { Relay } from "@coveo/headless/commerce";

import {
  AnalyticsProviderRoot,
  ConsoleAnalyticsProvider,
  CoveoAnalyticsProvider,
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

  it("defaults to an empty payload when none is provided", () => {
    const provider: AnalyticsProvider = { track: vi.fn() };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AnalyticsProviderRoot enabled provider={provider}>
        {children}
      </AnalyticsProviderRoot>
    );
    const { result } = renderHook(() => useAnalytics(), { wrapper });

    result.current.track("search_submitted");

    expect(provider.track).toHaveBeenCalledWith(
      expect.objectContaining({ payload: {} }) satisfies Partial<AnalyticsEvent>,
    );
  });

  it("forwards attachRelay to a provider that implements it, and tolerates one that does not", () => {
    const attachRelay = vi.fn();
    const provider: AnalyticsProvider = { attachRelay, track: vi.fn() };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AnalyticsProviderRoot enabled provider={provider}>
        {children}
      </AnalyticsProviderRoot>
    );
    const { result } = renderHook(() => useAnalytics(), { wrapper });

    const relay = { emit: vi.fn() } as unknown as Relay;
    result.current.attachRelay(relay);
    expect(attachRelay).toHaveBeenCalledWith(relay);

    const providerWithoutAttachRelay: AnalyticsProvider = { track: vi.fn() };
    const wrapperWithoutAttachRelay = ({ children }: { children: ReactNode }) => (
      <AnalyticsProviderRoot enabled provider={providerWithoutAttachRelay}>
        {children}
      </AnalyticsProviderRoot>
    );
    const withoutAttachRelay = renderHook(() => useAnalytics(), {
      wrapper: wrapperWithoutAttachRelay,
    });

    expect(() => withoutAttachRelay.result.current.attachRelay(relay)).not.toThrow();
  });

  it("logs events via the console provider", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const provider = new ConsoleAnalyticsProvider();
    const event: AnalyticsEvent = {
      name: "search_submitted",
      payload: { query: "digital" },
      timestamp: "2024-01-01T00:00:00.000Z",
    };

    provider.track(event);

    expect(infoSpy).toHaveBeenCalledWith("[analytics]", event);
    infoSpy.mockRestore();
  });

  describe("CoveoAnalyticsProvider", () => {
    it("queues events until a relay is attached, then flushes them in order", () => {
      const provider = new CoveoAnalyticsProvider();
      const relay = { emit: vi.fn() } as unknown as Relay;
      const firstEvent: AnalyticsEvent = {
        name: "product_compare_added",
        payload: { productId: "sku-1" },
        timestamp: "2024-01-01T00:00:00.000Z",
      };
      const secondEvent: AnalyticsEvent = {
        name: "product_compare_removed",
        payload: { productId: "sku-1" },
        timestamp: "2024-01-01T00:00:01.000Z",
      };

      provider.track(firstEvent);
      provider.track(secondEvent);
      expect(relay.emit).not.toHaveBeenCalled();

      provider.attachRelay(relay);

      expect(relay.emit).toHaveBeenNthCalledWith(1, "robomotion/product_compare_added", {
        productId: "sku-1",
        timestamp: firstEvent.timestamp,
      });
      expect(relay.emit).toHaveBeenNthCalledWith(2, "robomotion/product_compare_removed", {
        productId: "sku-1",
        timestamp: secondEvent.timestamp,
      });
    });

    it("emits directly once a relay is already attached, and tolerates detaching it", () => {
      const provider = new CoveoAnalyticsProvider();
      const relay = { emit: vi.fn() } as unknown as Relay;
      provider.attachRelay(relay);

      const event: AnalyticsEvent = {
        name: "product_details_opened",
        payload: { productId: "sku-2" },
        timestamp: "2024-01-01T00:00:02.000Z",
      };
      provider.track(event);

      expect(relay.emit).toHaveBeenCalledWith("robomotion/product_details_opened", {
        productId: "sku-2",
        timestamp: event.timestamp,
      });

      provider.attachRelay(undefined);
      const queuedEvent: AnalyticsEvent = {
        name: "product_details_opened",
        payload: { productId: "sku-3" },
        timestamp: "2024-01-01T00:00:03.000Z",
      };
      provider.track(queuedEvent);

      expect(relay.emit).not.toHaveBeenCalledWith("robomotion/product_details_opened", {
        productId: "sku-3",
        timestamp: queuedEvent.timestamp,
      });
    });
  });
});
