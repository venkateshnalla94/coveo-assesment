import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProductRightRail } from "@/components/commerce/ProductRightRail";

describe("ProductRightRail", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders the trending section when enableTrendingContent is true", () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ items: [] }), { status: 200 }),
    );

    render(<ProductRightRail featureFlags={{ enableTrendingContent: true }} query="robot" />);

    expect(screen.getByRole("heading", { name: "Related Technical Resources" })).toBeTruthy();
  });

  it("hides the trending section when enableTrendingContent is false", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    render(<ProductRightRail featureFlags={{ enableTrendingContent: false }} query="robot" />);

    expect(
      screen.queryByRole("heading", { name: "Related Technical Resources" }),
    ).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
