import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const replaceMock = vi.fn();
const submitSearchSpy = vi.fn();
const updateSortSpy = vi.fn();
let mockResponse: unknown;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

// The headless commerce engine adapter is exercised by its own unit tests; here we only need a
// controllable stand-in so submitSearch's trim/no-op/URL/committedQuery behavior can be driven
// through real user interaction with the search box.
vi.mock("@/features/commerce/headless/use-headless-commerce", () => ({
  useHeadlessCommerce: ({ initialQuery }: { initialQuery: string }) => {
    const [query, setQuery] = useState(initialQuery);

    return {
      clearAllFacets: vi.fn(),
      clearFacet: vi.fn(),
      clearQuery: () => setQuery(""),
      message: undefined,
      query,
      response: mockResponse,
      retry: vi.fn(),
      selectPage: vi.fn(),
      status: "success" as const,
      submitSearch: (nextQuery: string) => {
        submitSearchSpy(nextQuery);
        setQuery(nextQuery);
      },
      suggestionsProvider: { getSuggestions: vi.fn().mockResolvedValue([]) },
      toggleFacetValue: vi.fn(),
      toggleRange: vi.fn(),
      trackProductClick: vi.fn(),
      updateQuery: (nextQuery: string) => setQuery(nextQuery),
      updateSort: updateSortSpy,
    };
  },
}));

// Shallow-mocked so the test can assert on the `query` prop each receives without exercising
// their real Coveo trending/RGA network calls — the gating behavior under test (committedQuery
// vs. live per-keystroke query) lives in ProductDiscoveryExperience, not in these components.
vi.mock("@/components/commerce/ProductRightRail", () => ({
  ProductRightRail: ({ query }: { query: string }) => (
    <div data-testid="right-rail-query">{query}</div>
  ),
}));

vi.mock("@/components/generative/GenerativeAnswer", () => ({
  GenerativeAnswer: ({ query }: { query: string }) => (
    <div data-testid="generative-answer-query">{query}</div>
  ),
}));

import { ProductDiscoveryExperience } from "@/components/commerce/ProductDiscoveryExperience";
import { CoveoAnalyticsProvider } from "@/features/analytics/analytics";
import { Header } from "@/components/layout/Header";
import {
  HeaderSearchProvider,
  useHeaderSearchOverride,
} from "@/components/layout/header-search-context";
import type { HeadlessCommerceAuthConfig } from "@/features/commerce/headless/commerce-auth";
import { defaultSearchFeatureFlags } from "@/lib/features/search-feature-flags";

const configurationErrorAuthConfig = {
  message: "not configured",
  mode: "configuration-error" as const,
};

// `Header` now lives in the root layout and reads its live search wiring from
// `HeaderSearchContext` instead of a prop `ProductDiscoveryExperience` hands it directly. This
// harness stands in for that layout-level consumer so these tests can still drive the real
// `Header`/`SearchBox` UI to exercise ProductDiscoveryExperience's submit/query behavior.
function HeaderSearchHarness({ authConfig }: { authConfig: HeadlessCommerceAuthConfig }) {
  const override = useHeaderSearchOverride();
  return <Header activePath="/catalog" authConfig={authConfig} search={override} />;
}

function renderProductDiscoveryExperience(
  props: ComponentProps<typeof ProductDiscoveryExperience>,
) {
  return render(
    <HeaderSearchProvider>
      <HeaderSearchHarness authConfig={configurationErrorAuthConfig} />
      <ProductDiscoveryExperience {...props} />
    </HeaderSearchProvider>,
  );
}

function mockTrendingFetch() {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify({ items: [] }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    }),
  );
}

afterEach(() => {
  cleanup();
  replaceMock.mockClear();
  submitSearchSpy.mockClear();
  updateSortSpy.mockClear();
  mockResponse = undefined;
  vi.restoreAllMocks();
});

describe("ProductDiscoveryExperience", () => {
  it("trims a submitted query and replaces the URL", async () => {
    mockTrendingFetch();

    renderProductDiscoveryExperience({
      commerceAuthConfig: configurationErrorAuthConfig,
      featureFlags: defaultSearchFeatureFlags,
      initialQuery: "welding arm",
    });

    const input = screen.getByRole("combobox", { name: "Search" });
    await userEvent.clear(input);
    await userEvent.type(input, "  gripper arm  ");
    await userEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(submitSearchSpy).toHaveBeenCalledWith("gripper arm");
    expect(replaceMock).toHaveBeenCalledWith("/catalog?q=gripper%20arm", { scroll: false });
  });

  it("no-ops on a blank submitted query, leaving the URL unchanged", async () => {
    mockTrendingFetch();

    renderProductDiscoveryExperience({
      commerceAuthConfig: configurationErrorAuthConfig,
      featureFlags: defaultSearchFeatureFlags,
      initialQuery: "welding arm",
    });

    const input = screen.getByRole("combobox", { name: "Search" });
    await userEvent.clear(input);
    await userEvent.type(input, "   ");
    await userEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(submitSearchSpy).not.toHaveBeenCalled();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("renders a read-only sort label when zero or one sort options are available", async () => {
    mockTrendingFetch();
    mockResponse = {
      appliedSort: "relevance",
      availableSorts: [{ id: "relevance", label: "Relevance" }],
      facets: [],
      pagination: { page: 0, perPage: 24, totalEntries: 0, totalPages: 0, totalProducts: 0 },
      products: [],
      totalCount: 0,
    };

    renderProductDiscoveryExperience({
      commerceAuthConfig: configurationErrorAuthConfig,
      featureFlags: defaultSearchFeatureFlags,
      initialQuery: "welding arm",
    });

    expect(screen.queryByRole("combobox", { name: "Sort by" })).toBeNull();
    expect(screen.getByText("Relevance", { selector: ".sort-readonly" })).not.toBeNull();
  });

  it("renders a sort select when multiple sort options are available and updates sort on change", async () => {
    mockTrendingFetch();
    const trackSpy = vi.spyOn(CoveoAnalyticsProvider.prototype, "track");
    mockResponse = {
      appliedSort: "relevance",
      availableSorts: [
        { id: "relevance", label: "Relevance" },
        { id: "ec_price:desc", label: "Price (High to Low)" },
      ],
      facets: [],
      pagination: { page: 0, perPage: 24, totalEntries: 0, totalPages: 0, totalProducts: 0 },
      products: [],
      totalCount: 0,
    };

    renderProductDiscoveryExperience({
      commerceAuthConfig: configurationErrorAuthConfig,
      featureFlags: defaultSearchFeatureFlags,
      initialQuery: "welding arm",
    });

    const select = screen.getByRole<HTMLSelectElement>("combobox", { name: "Sort by" });
    expect(select.value).toBe("relevance");
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Relevance",
      "Price (High to Low)",
    ]);

    await userEvent.selectOptions(select, "ec_price:desc");

    expect(updateSortSpy).toHaveBeenCalledWith("ec_price:desc");
    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "commerce_sort_changed",
        payload: { query: "welding arm", sort: "ec_price:desc" },
      }),
    );
  });

  it("keeps the right rail and generative answer query pinned to committedQuery while typing, and updates only on submit", async () => {
    mockTrendingFetch();

    renderProductDiscoveryExperience({
      commerceAuthConfig: configurationErrorAuthConfig,
      featureFlags: defaultSearchFeatureFlags,
      initialQuery: "welding arm",
    });

    expect(screen.getByTestId("right-rail-query").textContent).toBe("welding arm");
    expect(screen.getByTestId("generative-answer-query").textContent).toBe("welding arm");

    const input = screen.getByRole("combobox", { name: "Search" });
    await userEvent.clear(input);
    await userEvent.type(input, "gripper arm");

    // Typing alone (no submit) must not move either query off the last committed search.
    expect(screen.getByTestId("right-rail-query").textContent).toBe("welding arm");
    expect(screen.getByTestId("generative-answer-query").textContent).toBe("welding arm");

    await userEvent.click(screen.getByRole("button", { name: "Search" }));

    // Submitting advances committedQuery, so both should now reflect the new query.
    expect(screen.getByTestId("right-rail-query").textContent).toBe("gripper arm");
    expect(screen.getByTestId("generative-answer-query").textContent).toBe("gripper arm");
  });
});
