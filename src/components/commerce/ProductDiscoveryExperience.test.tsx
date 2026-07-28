import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const replaceMock = vi.fn();
const submitSearchSpy = vi.fn();
const updateSortSpy = vi.fn();
const clearAllFacetsSpy = vi.fn();
const clearFacetSpy = vi.fn();
const toggleFacetValueSpy = vi.fn();
const toggleRangeSpy = vi.fn();
const retrySpy = vi.fn();
const selectPageSpy = vi.fn();
const trackProductClickSpy = vi.fn();
let mockResponse: unknown;
let mockStatus: "loading" | "success" | "empty" | "error" = "success";
let mockMessage: string | undefined;

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
      clearAllFacets: clearAllFacetsSpy,
      clearFacet: clearFacetSpy,
      clearQuery: () => setQuery(""),
      message: mockMessage,
      query,
      response: mockResponse,
      retry: retrySpy,
      selectPage: selectPageSpy,
      status: mockStatus,
      submitSearch: (nextQuery: string) => {
        submitSearchSpy(nextQuery);
        setQuery(nextQuery);
      },
      suggestionsProvider: { getSuggestions: vi.fn().mockResolvedValue([]) },
      toggleFacetValue: toggleFacetValueSpy,
      toggleRange: toggleRangeSpy,
      trackProductClick: trackProductClickSpy,
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
  clearAllFacetsSpy.mockClear();
  clearFacetSpy.mockClear();
  toggleFacetValueSpy.mockClear();
  toggleRangeSpy.mockClear();
  retrySpy.mockClear();
  selectPageSpy.mockClear();
  trackProductClickSpy.mockClear();
  mockResponse = undefined;
  mockStatus = "success";
  mockMessage = undefined;
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

  it("wires facet panel callbacks through to the commerce engine with analytics", async () => {
    mockTrendingFetch();
    const trackSpy = vi.spyOn(CoveoAnalyticsProvider.prototype, "track");
    mockResponse = {
      appliedSort: "relevance",
      availableSorts: [{ id: "relevance", label: "Relevance" }],
      facets: [
        {
          field: "brand",
          id: "brand-facet",
          label: "Brand",
          type: "regular" as const,
          values: [{ count: 5, label: "Acme", selected: true, value: "Acme" }],
        },
        {
          field: "ec_weight",
          id: "weight-facet",
          label: "Weight",
          type: "numericalRange" as const,
          values: [{ count: 3, end: 10, endInclusive: true, selected: false, start: 0 }],
        },
      ],
      pagination: { page: 0, perPage: 24, totalEntries: 0, totalPages: 0, totalProducts: 0 },
      products: [],
      totalCount: 0,
    };

    renderProductDiscoveryExperience({
      commerceAuthConfig: configurationErrorAuthConfig,
      featureFlags: defaultSearchFeatureFlags,
      initialQuery: "welding arm",
    });

    // Selected regular facet value renders an active-filter chip; removing it toggles the value.
    await userEvent.click(screen.getByRole("button", { name: /Brand: Acme/ }));
    expect(toggleFacetValueSpy).toHaveBeenCalledWith("brand", "Acme", "regular");
    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: "commerce_facet_selected" }),
    );

    // Numeric range facet value (non ec_price/ec_rating) toggles a range.
    await userEvent.click(screen.getByRole("button", { name: /^0-10/ }));
    expect(toggleRangeSpy).toHaveBeenCalledWith("ec_weight", 0, 10);

    // Clearing the brand facet only clears that field.
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(clearFacetSpy).toHaveBeenCalledWith("brand");
    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: "commerce_facet_removed", payload: { field: "brand", query: "welding arm" } }),
    );

    // Clear all wipes every facet selection.
    await userEvent.click(screen.getByRole("button", { name: "Clear all" }));
    expect(clearAllFacetsSpy).toHaveBeenCalled();
    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: "filters_cleared" }),
    );
  });

  it("opens product details from Quick View, and drawer actions call through with analytics", async () => {
    mockTrendingFetch();
    const trackSpy = vi.spyOn(CoveoAnalyticsProvider.prototype, "track");
    mockResponse = {
      appliedSort: "relevance",
      availableSorts: [{ id: "relevance", label: "Relevance" }],
      facets: [],
      pagination: { page: 0, perPage: 24, totalEntries: 1, totalPages: 1, totalProducts: 1 },
      products: [
        {
          categories: [],
          compatibleJoints: [],
          compatiblePartsSkus: [],
          compatibleRobotSeries: [],
          compatibleRobots: [],
          description: "A precision gripper arm.",
          id: "product-1",
          images: [],
          title: "Gripper Arm",
          url: "https://example.test/products/product-1",
        },
      ],
      totalCount: 1,
    };

    renderProductDiscoveryExperience({
      commerceAuthConfig: configurationErrorAuthConfig,
      featureFlags: defaultSearchFeatureFlags,
      initialQuery: "welding arm",
    });

    await userEvent.click(screen.getByRole("button", { name: "Quick view product" }));
    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: "product_details_opened", payload: { productId: "product-1" } }),
    );
    expect(trackProductClickSpy).toHaveBeenCalledWith("product-1");

    const dialog = screen.getByRole("dialog", { name: "Product details" });
    expect(dialog).not.toBeNull();

    await userEvent.click(screen.getByRole("link", { name: "View Product" }));
    expect(trackProductClickSpy).toHaveBeenCalledWith("product-1");

    await userEvent.click(screen.getByRole("button", { name: "Contact Sales" }));
    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: "contact_sales_clicked", payload: { productId: "product-1" } }),
    );

    await userEvent.click(screen.getByRole("button", { name: "Request Quote" }));
    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: "request_quote_clicked", payload: { productId: "product-1" } }),
    );

    await userEvent.click(screen.getByRole("button", { name: "Close product details" }));
    expect(screen.queryByRole("dialog", { name: "Product details" })).toBeNull();
  });

  it("retries a failed search and paginates results, both with analytics", async () => {
    mockTrendingFetch();
    const trackSpy = vi.spyOn(CoveoAnalyticsProvider.prototype, "track");
    mockStatus = "error";
    mockMessage = "Something went wrong.";
    mockResponse = {
      appliedSort: "relevance",
      availableSorts: [{ id: "relevance", label: "Relevance" }],
      facets: [],
      pagination: { page: 0, perPage: 10, totalEntries: 15, totalPages: 2, totalProducts: 15 },
      products: [],
      totalCount: 15,
    };

    renderProductDiscoveryExperience({
      commerceAuthConfig: configurationErrorAuthConfig,
      featureFlags: defaultSearchFeatureFlags,
      initialQuery: "welding arm",
    });

    expect(screen.getByRole("alert").textContent).toContain("Something went wrong.");
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(retrySpy).toHaveBeenCalled();
    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: "commerce_search_submitted", payload: { mode: "retry", query: "welding arm" } }),
    );

    await userEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(selectPageSpy).toHaveBeenCalledWith(1);
    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: "commerce_page_changed", payload: { page: 2, query: "welding arm" } }),
    );
  });

  it("falls back the right rail query to the default when no query has ever been committed", async () => {
    mockTrendingFetch();

    renderProductDiscoveryExperience({
      commerceAuthConfig: configurationErrorAuthConfig,
      featureFlags: defaultSearchFeatureFlags,
      initialQuery: "",
    });

    expect(screen.getByTestId("right-rail-query").textContent).toBe("welding arm");
  });

  it("tracks a product click when a result card's tile link is opened", async () => {
    mockTrendingFetch();
    mockResponse = {
      appliedSort: "relevance",
      availableSorts: [{ id: "relevance", label: "Relevance" }],
      facets: [],
      pagination: { page: 0, perPage: 24, totalEntries: 1, totalPages: 1, totalProducts: 1 },
      products: [
        {
          categories: [],
          compatibleJoints: [],
          compatiblePartsSkus: [],
          compatibleRobotSeries: [],
          compatibleRobots: [],
          description: "A precision gripper arm.",
          id: "product-1",
          images: [],
          title: "Gripper Arm",
          url: "https://example.test/products/product-1",
        },
      ],
      totalCount: 1,
    };

    renderProductDiscoveryExperience({
      commerceAuthConfig: configurationErrorAuthConfig,
      featureFlags: defaultSearchFeatureFlags,
      initialQuery: "welding arm",
    });

    await userEvent.click(
      screen.getByRole("link", { name: "Open Gripper Arm product page in a new tab" }),
    );

    expect(trackProductClickSpy).toHaveBeenCalledWith("product-1");
  });

  it("opens and closes the comparison drawer after adding a product to compare", async () => {
    mockTrendingFetch();
    mockResponse = {
      appliedSort: "relevance",
      availableSorts: [{ id: "relevance", label: "Relevance" }],
      facets: [],
      pagination: { page: 0, perPage: 24, totalEntries: 1, totalPages: 1, totalProducts: 1 },
      products: [
        {
          categories: [],
          compatibleJoints: [],
          compatiblePartsSkus: [],
          compatibleRobotSeries: [],
          compatibleRobots: [],
          description: "A precision gripper arm.",
          id: "product-1",
          images: [],
          title: "Gripper Arm",
        },
      ],
      totalCount: 1,
    };

    renderProductDiscoveryExperience({
      commerceAuthConfig: configurationErrorAuthConfig,
      featureFlags: defaultSearchFeatureFlags,
      initialQuery: "welding arm",
    });

    expect(screen.queryByRole("dialog", { name: "Compare products" })).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Compare" }));
    await userEvent.click(screen.getByRole("button", { name: "Compare (1)" }));

    const dialog = screen.getByRole("dialog", { name: "Compare products" });
    expect(dialog).not.toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Close comparison" }));
    expect(screen.queryByRole("dialog", { name: "Compare products" })).toBeNull();
  });
});
