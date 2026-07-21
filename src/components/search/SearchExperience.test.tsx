import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SearchExperience } from "./SearchExperience";
import type { CoveoSearchResponse } from "./response/search-response-types";
import type { SearchInsightsContent } from "./layout/SearchInsightsRail";
import type { SearchFeatureFlags } from "@/lib/features/search-feature-flags";

const mocks = vi.hoisted(() => ({
  buildFacet: vi.fn(),
  buildPager: vi.fn(),
  buildQueryError: vi.fn(),
  buildQuerySummary: vi.fn(),
  buildResultList: vi.fn(),
  buildSearchBox: vi.fn(),
  buildSearchEngine: vi.fn(),
  buildSearchStatus: vi.fn(),
  executeFirstSearch: vi.fn(),
  fetchSearchTokenConfig: vi.fn(),
  searchBoxSubmit: vi.fn(),
  searchBoxUpdateText: vi.fn(),
}));

vi.mock("@/lib/coveo/search-token", () => ({
  fetchSearchTokenConfig: mocks.fetchSearchTokenConfig,
}));

vi.mock("@/lib/coveo/use-controller-state", () => ({
  useControllerState: (controller: { state: unknown }) => controller.state,
}));

vi.mock("@coveo/headless", () => ({
  buildFacet: mocks.buildFacet,
  buildPager: mocks.buildPager,
  buildQueryError: mocks.buildQueryError,
  buildQuerySummary: mocks.buildQuerySummary,
  buildResultList: mocks.buildResultList,
  buildSearchBox: mocks.buildSearchBox,
  buildSearchEngine: mocks.buildSearchEngine,
  buildSearchStatus: mocks.buildSearchStatus,
  getOrganizationEndpoints: () => ({
    admin: "https://example.org.coveo.com/admin",
    analytics: "https://example.org.coveo.com/analytics",
    platform: "https://example.org.coveo.com",
    search: "https://example.org.coveo.com/rest/search",
  }),
}));

function controller<TState>(state: TState) {
  return {
    state,
    subscribe: vi.fn(() => vi.fn()),
  };
}

beforeEach(() => {
  Object.values(mocks).forEach((mock) => mock.mockReset());

  mocks.buildSearchEngine.mockReturnValue({ executeFirstSearch: mocks.executeFirstSearch });
  mocks.buildSearchBox.mockReturnValue({
    ...controller({ isLoading: false, isLoadingSuggestions: false, suggestions: [], value: "" }),
    clear: vi.fn(),
    selectSuggestion: vi.fn(),
    showSuggestions: vi.fn(),
    submit: mocks.searchBoxSubmit,
    updateText: mocks.searchBoxUpdateText,
  });
  mocks.buildResultList.mockReturnValue(
    controller({
      firstSearchExecuted: true,
      hasError: false,
      hasResults: false,
      isLoading: false,
      moreResultsAvailable: false,
      results: [],
      searchResponseId: "",
    }),
  );
  mocks.buildPager.mockReturnValue(
    controller({
      currentPage: 1,
      currentPages: [],
      hasNextPage: false,
      hasPreviousPage: false,
      maxPage: 1,
    }),
  );
  mocks.buildSearchStatus.mockReturnValue(
    controller({ firstSearchExecuted: true, hasError: false, hasResults: false, isLoading: false }),
  );
  mocks.buildQueryError.mockReturnValue(controller({ error: null, hasError: false }));
  mocks.buildQuerySummary.mockReturnValue(
    controller({
      durationInMilliseconds: 0,
      durationInSeconds: 0,
      firstResult: 0,
      firstSearchExecuted: true,
      hasDuration: false,
      hasError: false,
      hasQuery: false,
      hasResults: false,
      isLoading: false,
      lastResult: 0,
      query: "",
      total: 0,
    }),
  );
  mocks.buildFacet.mockReturnValue(
    controller({
      canShowLessValues: false,
      canShowMoreValues: false,
      enabled: true,
      facetId: "facet-source",
      hasActiveValues: false,
      isLoading: false,
      sortCriterion: "automatic",
      values: [],
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("SearchExperience startup behavior", () => {
  const completeConfig = {
    facetFields: ["source"],
    organizationId: "example-org",
    pipeline: "assessment-pipeline",
    searchHub: "assessment-hub",
    token: "search-token",
  };

  it("shows a search form before Coveo configuration is loaded", () => {
    render(<SearchExperience />);

    expect(screen.getByRole("searchbox", { name: "Search" }).getAttribute("disabled")).toBeNull();
    expect(screen.getByRole("button", { name: "Search" }).getAttribute("disabled")).toBeNull();
    expect(screen.queryByText("Search configuration required")).toBeNull();
    expect(mocks.fetchSearchTokenConfig).not.toHaveBeenCalled();
  });

  it("shows a friendly configuration message after a failed submitted search", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.fetchSearchTokenConfig.mockRejectedValue(new Error("Missing required environment variable: COVEO_ORGANIZATION_ID"));

    render(<SearchExperience />);

    await userEvent.type(screen.getByRole("searchbox", { name: "Search" }), "analytics");
    await userEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByText("Search configuration required")).toBeTruthy();
    expect((screen.getByRole("searchbox", { name: "Search" }) as HTMLInputElement).value).toBe("analytics");
    expect(screen.getByText("Update the Coveo values in .env.local, then restart the development server.")).toBeTruthy();
    expect(screen.queryByText("Missing required environment variable: COVEO_ORGANIZATION_ID")).toBeNull();
    expect(consoleError).toHaveBeenCalledWith(
      "Coveo search initialization failed:",
      expect.objectContaining({ message: "Missing required environment variable: COVEO_ORGANIZATION_ID" }),
    );
  });

  it("hands the submitted query to the Headless search box after configuration succeeds", async () => {
    mocks.fetchSearchTokenConfig.mockResolvedValue(completeConfig);

    render(<SearchExperience />);

    await userEvent.type(screen.getByRole("searchbox", { name: "Search" }), "machine learning");
    await userEvent.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => {
      expect(mocks.searchBoxUpdateText).toHaveBeenCalledWith("machine learning");
      expect(mocks.searchBoxSubmit).toHaveBeenCalled();
    });
  });

  it("executes the first search when configuration succeeds without a submitted query", async () => {
    mocks.fetchSearchTokenConfig.mockResolvedValue({
      facetFields: [],
      organizationId: "example-org",
      token: "search-token",
    });

    render(<SearchExperience />);

    await userEvent.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => {
      expect(mocks.executeFirstSearch).toHaveBeenCalled();
    });
    expect(screen.getByText("default-search-hub")).toBeTruthy();
    expect(mocks.searchBoxUpdateText).not.toHaveBeenCalled();
  });

  it("renews the search token from the latest configuration endpoint response", async () => {
    mocks.fetchSearchTokenConfig
      .mockResolvedValueOnce(completeConfig)
      .mockResolvedValueOnce({ ...completeConfig, token: "renewed-search-token" });

    render(<SearchExperience />);

    await userEvent.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => {
      expect(mocks.buildSearchEngine).toHaveBeenCalled();
    });

    const [{ configuration }] = mocks.buildSearchEngine.mock.calls[0];

    await expect(configuration.renewAccessToken()).resolves.toBe("renewed-search-token");
  });
});

describe("SearchExperience sample response mode", () => {
  const sampleSearchResponse: CoveoSearchResponse = {
    durationInSeconds: 0.09,
    facets: [
      {
        field: "filetype",
        label: "Content Type",
        values: [
          { numberOfResults: 10, state: "selected", value: "All" },
          { numberOfResults: 4, state: "idle", value: "PDF" },
        ],
      },
    ],
    firstResult: 1,
    lastResult: 1,
    query: "digital transformation",
    results: [
      {
        clickUri: "https://example.test/guide",
        date: "2026-07-18T10:00:00Z",
        excerpt: "Sample excerpt from a Coveo-shaped result.",
        filetype: "pdf",
        printableUri: "example.test / guide",
        source: "Knowledge Base",
        tags: ["Guide"],
        title: "Sample Digital Transformation Guide",
        uniqueId: "sample-guide",
      },
      {
        clickUri: "https://example.test/web",
        date: "2026-07-17T10:00:00Z",
        excerpt: "Sample web result.",
        filetype: "html",
        printableUri: "example.test / web",
        source: "Coveo Website",
        tags: ["Web"],
        title: "Sample Digital Transformation Web Page",
        uniqueId: "sample-web",
      },
      {
        clickUri: "https://example.test/presentation",
        date: "2026-07-16T10:00:00Z",
        excerpt: "Sample presentation result.",
        filetype: "pptx",
        printableUri: "example.test / presentation",
        source: "Knowledge Base",
        tags: ["Deck"],
        title: "Sample Digital Transformation Presentation",
        uniqueId: "sample-presentation",
      },
      {
        clickUri: "https://example.test/workbook",
        date: "2026-07-15T10:00:00Z",
        excerpt: "Sample workbook result.",
        filetype: "xlsx",
        printableUri: "example.test / workbook",
        source: "Customer Portal",
        tags: ["Workbook"],
        title: "Sample Digital Transformation Workbook",
        uniqueId: "sample-workbook",
      },
      {
        clickUri: "https://example.test/playbook",
        date: "2026-07-14T10:00:00Z",
        excerpt: "Sample playbook result.",
        filetype: "docx",
        printableUri: "example.test / playbook",
        source: "Knowledge Base",
        tags: ["Doc"],
        title: "Sample Digital Transformation Playbook",
        uniqueId: "sample-playbook",
      },
    ],
    searchHub: "sample-search-hub",
    totalCount: 10,
  };

  const insightsContent: SearchInsightsContent = {
    popularContent: {
      items: [{ href: "#", metric: "2.3K views", title: "Popular sample content" }],
      title: "Popular content",
    },
    relatedQueries: {
      items: ["digital transformation strategy"],
      title: "Related queries",
    },
    topic: {
      actionLabel: "Learn more",
      body: "Topic body from JSON-backed content.",
      href: "#",
      title: "About this topic",
    },
  };

  const enabledFlags: SearchFeatureFlags = {
    enableFacets: true,
    enableInsightsRail: true,
    enablePopularContent: true,
    enableRelatedQueries: true,
    enableSampleSearchResponse: true,
    enableTopicInsight: true,
  };

  it("renders sample response facets, results, and insight rail without initializing Coveo", () => {
    render(
      <SearchExperience
        featureFlags={enabledFlags}
        insightsContent={insightsContent}
        sampleSearchResponse={sampleSearchResponse}
      />,
    );

    expect(screen.getByText("Content Type")).toBeTruthy();
    expect(screen.getByText("Sample Digital Transformation Guide")).toBeTruthy();
    expect(screen.getByText("sample-search-hub")).toBeTruthy();
    expect(screen.getByText("About this topic")).toBeTruthy();
    expect(screen.getByText("Related queries")).toBeTruthy();
    expect(screen.getByText("Popular content")).toBeTruthy();
    expect(mocks.fetchSearchTokenConfig).not.toHaveBeenCalled();
    expect(mocks.buildSearchEngine).not.toHaveBeenCalled();
  });

  it("hides flagged sample response sections while keeping results visible", () => {
    render(
      <SearchExperience
        featureFlags={{
          ...enabledFlags,
          enableFacets: false,
          enablePopularContent: false,
          enableRelatedQueries: false,
          enableTopicInsight: false,
        }}
        insightsContent={insightsContent}
        sampleSearchResponse={sampleSearchResponse}
      />,
    );

    expect(screen.getByText("Sample Digital Transformation Guide")).toBeTruthy();
    expect(screen.queryByText("Content Type")).toBeNull();
    expect(screen.queryByText("About this topic")).toBeNull();
    expect(screen.queryByText("Related queries")).toBeNull();
    expect(screen.queryByText("Popular content")).toBeNull();
  });

  it("lets sample response facets be selected and cleared", async () => {
    render(
      <SearchExperience
        featureFlags={enabledFlags}
        insightsContent={insightsContent}
        sampleSearchResponse={sampleSearchResponse}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "PDF 4" }));

    expect(screen.getByRole("button", { name: "PDF 4" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(screen.getByText("Sample Digital Transformation Guide")).toBeTruthy();
    expect(screen.queryByText("Sample Digital Transformation Web Page")).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Clear all" }));

    expect(screen.getByRole("button", { name: "PDF 4" }).getAttribute("aria-pressed")).toBe(
      "false",
    );
    expect(screen.getByText("Sample Digital Transformation Web Page")).toBeTruthy();
  });

  it("paginates sample response results at four cards per page", async () => {
    render(
      <SearchExperience
        featureFlags={enabledFlags}
        insightsContent={insightsContent}
        sampleSearchResponse={sampleSearchResponse}
      />,
    );

    expect(screen.getByText("Sample Digital Transformation Guide")).toBeTruthy();
    expect(screen.queryByText("Sample Digital Transformation Playbook")).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "2" }));

    expect(screen.getByText("Sample Digital Transformation Playbook")).toBeTruthy();
    expect(screen.queryByText("Sample Digital Transformation Guide")).toBeNull();
  });
});
