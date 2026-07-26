import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

let mockPathname = "/";
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

vi.mock("@/components/layout/Header", () => ({
  Header: (props: Record<string, unknown>) => (
    <div data-testid="header-stub">
      <span data-testid="active-path">{String(props.activePath)}</span>
      <span data-testid="current-query">{String(props.currentQuery ?? "")}</span>
      <span data-testid="has-search-override">{props.search ? "yes" : "no"}</span>
    </div>
  ),
}));

import { AppChrome, deriveActivePath } from "@/components/layout/AppChrome";
import {
  HeaderSearchProvider,
  usePublishHeaderSearch,
} from "@/components/layout/header-search-context";

const configurationErrorAuthConfig = {
  message: "not configured",
  mode: "configuration-error" as const,
};

afterEach(() => {
  cleanup();
  mockPathname = "/";
  mockSearchParams = new URLSearchParams();
});

describe("deriveActivePath", () => {
  it("maps blog routes", () => {
    expect(deriveActivePath("/blog")).toBe("/blog");
    expect(deriveActivePath("/blog/some-article")).toBe("/blog");
  });

  it("maps catalog and product routes to /catalog", () => {
    expect(deriveActivePath("/catalog")).toBe("/catalog");
    expect(deriveActivePath("/products/abc-123")).toBe("/catalog");
  });

  it("maps everything else to home", () => {
    expect(deriveActivePath("/")).toBe("/");
    expect(deriveActivePath("/unknown")).toBe("/");
  });
});

describe("AppChrome", () => {
  it("derives activePath and currentQuery from the current route", () => {
    mockPathname = "/products/abc-123";
    mockSearchParams = new URLSearchParams({ q: "welding arm" });

    render(
      <HeaderSearchProvider>
        <AppChrome authConfig={configurationErrorAuthConfig} />
      </HeaderSearchProvider>,
    );

    expect(screen.getByTestId("active-path").textContent).toBe("/catalog");
    expect(screen.getByTestId("current-query").textContent).toBe("welding arm");
  });

  it("omits currentQuery when ?q= is absent or blank", () => {
    mockPathname = "/blog";
    mockSearchParams = new URLSearchParams({ q: "   " });

    render(
      <HeaderSearchProvider>
        <AppChrome authConfig={configurationErrorAuthConfig} />
      </HeaderSearchProvider>,
    );

    expect(screen.getByTestId("current-query").textContent).toBe("");
  });

  it("passes through a published search override from context", () => {
    mockPathname = "/catalog";

    function Publisher() {
      usePublishHeaderSearch({
        isLoading: false,
        onClear: vi.fn(),
        onQueryChange: vi.fn(),
        onSubmit: vi.fn(),
        provider: { getSuggestions: vi.fn().mockResolvedValue([]) },
        query: "gripper",
      });
      return null;
    }

    render(
      <HeaderSearchProvider>
        <AppChrome authConfig={configurationErrorAuthConfig} />
        <Publisher />
      </HeaderSearchProvider>,
    );

    expect(screen.getByTestId("has-search-override").textContent).toBe("yes");
  });

  it("has no search override outside of a publishing page", () => {
    mockPathname = "/";

    render(
      <HeaderSearchProvider>
        <AppChrome authConfig={configurationErrorAuthConfig} />
      </HeaderSearchProvider>,
    );

    expect(screen.getByTestId("has-search-override").textContent).toBe("no");
  });
});
