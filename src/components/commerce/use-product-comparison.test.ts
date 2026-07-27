import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useProductComparison } from "@/components/commerce/use-product-comparison";
import type { Analytics } from "@/features/analytics/analytics";
import type { ProductResult } from "@/features/commerce/models/commerce-models";

function makeProduct(id: string): ProductResult {
  return { id } as ProductResult;
}

function makeAnalytics(): Analytics {
  return { attachRelay: vi.fn(), track: vi.fn() };
}

describe("useProductComparison", () => {
  it("adds and removes products, tracking each transition", () => {
    const analytics = makeAnalytics();
    const { result } = renderHook(() => useProductComparison(analytics));

    act(() => result.current.toggleCompare(makeProduct("p1")));
    expect(result.current.comparedProducts.map((p) => p.id)).toEqual(["p1"]);
    expect(analytics.track).toHaveBeenLastCalledWith("product_compare_added", { productId: "p1" });

    act(() => result.current.toggleCompare(makeProduct("p1")));
    expect(result.current.comparedProducts).toEqual([]);
    expect(analytics.track).toHaveBeenLastCalledWith("product_compare_removed", { productId: "p1" });
  });

  it("caps the compared list at 3 products", () => {
    const analytics = makeAnalytics();
    const { result } = renderHook(() => useProductComparison(analytics));

    act(() => {
      result.current.toggleCompare(makeProduct("p1"));
      result.current.toggleCompare(makeProduct("p2"));
      result.current.toggleCompare(makeProduct("p3"));
      result.current.toggleCompare(makeProduct("p4"));
    });

    expect(result.current.comparedProducts.map((p) => p.id)).toEqual(["p1", "p2", "p3"]);
  });

  it("removeComparedProduct removes by id and tracks the event", () => {
    const analytics = makeAnalytics();
    const { result } = renderHook(() => useProductComparison(analytics));

    act(() => result.current.toggleCompare(makeProduct("p1")));
    act(() => result.current.removeComparedProduct("p1"));

    expect(result.current.comparedProducts).toEqual([]);
    expect(analytics.track).toHaveBeenLastCalledWith("product_compare_removed", { productId: "p1" });
  });

  it("openComparison tracks the current count and opens the drawer", () => {
    const analytics = makeAnalytics();
    const { result } = renderHook(() => useProductComparison(analytics));

    act(() => result.current.toggleCompare(makeProduct("p1")));
    act(() => result.current.openComparison());

    expect(result.current.comparisonOpen).toBe(true);
    expect(analytics.track).toHaveBeenLastCalledWith("product_compare_opened", { count: 1 });
  });

  it("closeComparison closes the drawer and clearComparison empties the list", () => {
    const analytics = makeAnalytics();
    const { result } = renderHook(() => useProductComparison(analytics));

    act(() => {
      result.current.toggleCompare(makeProduct("p1"));
      result.current.openComparison();
    });
    act(() => result.current.closeComparison());
    expect(result.current.comparisonOpen).toBe(false);

    act(() => result.current.clearComparison());
    expect(result.current.comparedProducts).toEqual([]);
  });
});
