"use client";

import {
  buildFacet,
  buildPager,
  buildQueryError,
  buildQuerySummary,
  buildResultList,
  buildSearchBox,
  buildSearchEngine,
  buildSearchStatus,
  getOrganizationEndpoints,
} from "@coveo/headless";
import type {
  Facet,
  Pager,
  QueryError,
  QuerySummary,
  ResultList,
  SearchBox as HeadlessSearchBox,
  SearchEngine,
  SearchStatus,
} from "@coveo/headless";
import { AlertCircle, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import { GenerativeAnswer } from "@/components/generative/GenerativeAnswer";
import { ConfigurationNotice } from "@/components/shared/ConfigurationNotice";
import { FacetPanel } from "@/components/search/facets/FacetPanel";
import {
  SearchInsightsRail,
  type SearchInsightsContent,
} from "@/components/search/layout/SearchInsightsRail";
import { PagerControls } from "@/components/search/PagerControls";
import { Pagination } from "@/components/search/Pagination";
import { DomainFacetPanel } from "@/components/search/facets/DomainFacetPanel";
import { SearchBox } from "@/components/search/SearchBox";
import type { SearchResponse } from "@/components/search/response/search-response-types";
import { ResultListView } from "@/components/search/results/ResultListView";
import { SearchResults } from "@/components/search/results/SearchResults";
import { SearchStatus as DomainSearchStatus } from "@/components/search/results/SearchStatus";
import { SearchBoxView } from "@/components/search/SearchBoxView";
import { SearchSummary } from "@/components/search/SearchSummary";
import { SortControl } from "@/components/search/SortControl";
import { SEARCH_UI } from "@/components/search/search-ui.constants";
import { useSampleExperienceProviders } from "@/components/search/use-sample-experience-providers";
import {
  AnalyticsProviderRoot,
  ConsoleAnalyticsProvider,
  CoveoAnalyticsProvider,
  createSearchAnalyticsPayload,
  useAnalytics,
} from "@/features/analytics/analytics";
import { CoveoGenerativeProvider } from "@/features/generative/providers/coveo-generative-provider";
import { InMemoryFeedbackProvider } from "@/features/generative/providers/feedback-provider";
import type { DemoProfile } from "@/features/demo-profiles/demo-profiles";
import type { DevelopmentScenario } from "@/features/development/scenarios";
import { getFacetLabel, getFacetOrder } from "@/features/search/config/facets";
import type { SearchResult } from "@/features/search/models/search-models";
import type { GenerativeAnswer as GenerativeAnswerModel } from "@/features/generative/models/generative-models";
import { getSearchStateResponse, searchStateReducer } from "@/features/search/models/search-state";
import {
  coveoGenerativeCapabilities,
  coveoHeadlessCapabilities,
  inMemorySearchCapabilities,
  mockGenerativeCapabilities,
  type GenerativeProviderCapabilities,
  type SearchProviderCapabilities,
} from "@/features/search/capabilities/provider-capabilities";
import { getPaginationState } from "@/features/search/services/pagination";
import {
  clearSearchQueryFacet,
  clearSearchQueryFilters,
  DEFAULT_SEARCH_QUERY,
  normalizeSearchQuery,
  setSearchQueryPage,
  setSearchQuerySort,
  setSearchQueryText,
  toggleSearchQueryFacet,
} from "@/features/search/services/search-query";
import {
  DEFAULT_URL_FACETS,
  parseSearchUrlState,
  searchQueryFromUrlState,
  searchUrlStateFromQuery,
  serializeSearchUrlState,
} from "@/features/search/services/search-url-state";
import {
  defaultSearchFeatureFlags,
  type SearchFeatureFlags,
} from "@/lib/features/search-feature-flags";
import type { TrendingItem } from "@/features/trending/models/trending-models";
import { MockTrendingProvider } from "@/features/trending/providers/mock-trending-provider";
import { fetchSearchTokenConfig, type SearchTokenConfig } from "@/lib/coveo/search-token";
import { useControllerState } from "@/lib/coveo/use-controller-state";
import { ConsoleLogger, type Logger } from "@/lib/logging/logger";
import { toApplicationError } from "@/lib/errors/application-error";

type EngineState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; engine: SearchEngine; config: SearchTokenConfig; initialQuery: string }
  | { status: "configuration-error" };

type SearchControllers = {
  searchBox: HeadlessSearchBox;
  resultList: ResultList;
  pager: Pager;
  searchStatus: SearchStatus;
  queryError: QueryError;
  querySummary: QuerySummary;
  facets: Array<{
    field: string;
    controller: Facet;
  }>;
};

function createEngine(config: SearchTokenConfig) {
  return buildSearchEngine({
    configuration: {
      organizationId: config.organizationId,
      accessToken: config.token,
      renewAccessToken: async () => {
        const renewedConfig = await fetchSearchTokenConfig();
        return renewedConfig.token;
      },
      organizationEndpoints: getOrganizationEndpoints(config.organizationId),
      analytics: {
        enabled: true,
        originContext: "Search",
      },
      search: {
        ...(config.searchHub ? { searchHub: config.searchHub } : {}),
        ...(config.pipeline ? { pipeline: config.pipeline } : {}),
      },
    },
  });
}

function createControllers(engine: SearchEngine, facetFields: string[]): SearchControllers {
  return {
    searchBox: buildSearchBox(engine, {
      options: {
        numberOfSuggestions: 5,
      },
    }),
    resultList: buildResultList(engine, {
      options: {
        fieldsToInclude: [
          "author",
          "date",
          "documenttype",
          "filetype",
          "language",
          "source",
          "thumbnail",
          "thumbnailuri",
        ],
      },
    }),
    pager: buildPager(engine, {
      options: {
        numberOfPages: 5,
      },
    }),
    searchStatus: buildSearchStatus(engine),
    queryError: buildQueryError(engine),
    querySummary: buildQuerySummary(engine),
    facets: facetFields.map((field) => ({
      field,
      controller: buildFacet(engine, {
        options: {
          field,
          facetId: `facet-${field}`,
          numberOfValues: 6,
          sortCriteria: "automatic",
        },
      }),
    })),
  };
}

export function SearchExperience({
  capabilities,
  development = { queryOverridesEnabled: false },
  environment = "development",
  featureFlags = defaultSearchFeatureFlags,
  insightsContent,
  logger = new ConsoleLogger("warn"),
  profile,
  scenario = "default",
  sampleSearchResponse,
  suggestedQueries,
  generativeFixture,
  trendingItems,
}: {
  capabilities?: {
    search: SearchProviderCapabilities;
    generative: GenerativeProviderCapabilities;
  };
  development?: { queryOverridesEnabled: boolean };
  environment?: "development" | "test" | "production";
  featureFlags?: SearchFeatureFlags;
  insightsContent?: SearchInsightsContent;
  logger?: Logger;
  profile?: DemoProfile;
  scenario?: DevelopmentScenario;
  sampleSearchResponse?: SearchResponse;
  suggestedQueries?: string[];
  generativeFixture?: Omit<GenerativeAnswerModel, "id" | "query">;
  trendingItems?: TrendingItem[];
}) {
  const [engineState, setEngineState] = useState<EngineState>({ status: "idle" });
  const [pendingQuery, setPendingQuery] = useState("");
  const analyticsProvider = useMemo(
    () =>
      featureFlags.enableSampleSearchResponse
        ? new ConsoleAnalyticsProvider()
        : new CoveoAnalyticsProvider(),
    [featureFlags.enableSampleSearchResponse],
  );

  return (
    <AnalyticsProviderRoot enabled={featureFlags.enableAnalytics} provider={analyticsProvider}>
      <SearchExperienceContent
        engineState={engineState}
        capabilities={
          capabilities ?? {
            generative: featureFlags.enableSampleSearchResponse
              ? mockGenerativeCapabilities
              : coveoGenerativeCapabilities,
            search: featureFlags.enableSampleSearchResponse
              ? inMemorySearchCapabilities
              : coveoHeadlessCapabilities,
          }
        }
        development={development}
        environment={environment}
        featureFlags={featureFlags}
        insightsContent={insightsContent}
        logger={logger}
        onEngineStateChange={setEngineState}
        onPendingQueryChange={setPendingQuery}
        pendingQuery={pendingQuery}
        profile={profile}
        scenario={scenario}
        sampleSearchResponse={sampleSearchResponse}
        suggestedQueries={suggestedQueries}
        generativeFixture={generativeFixture}
        trendingItems={trendingItems}
      />
    </AnalyticsProviderRoot>
  );
}

function SearchExperienceContent({
  engineState,
  capabilities,
  development,
  environment,
  featureFlags,
  insightsContent,
  logger,
  onEngineStateChange,
  onPendingQueryChange,
  pendingQuery,
  profile,
  scenario,
  sampleSearchResponse,
  suggestedQueries,
  generativeFixture,
  trendingItems,
}: {
  engineState: EngineState;
  capabilities: {
    search: SearchProviderCapabilities;
    generative: GenerativeProviderCapabilities;
  };
  development: { queryOverridesEnabled: boolean };
  environment: "development" | "test" | "production";
  featureFlags: SearchFeatureFlags;
  insightsContent?: SearchInsightsContent;
  logger: Logger;
  onEngineStateChange: (state: EngineState) => void;
  onPendingQueryChange: (query: string) => void;
  pendingQuery: string;
  profile?: DemoProfile;
  scenario: DevelopmentScenario;
  sampleSearchResponse?: SearchResponse;
  suggestedQueries?: string[];
  generativeFixture?: Omit<GenerativeAnswerModel, "id" | "query">;
  trendingItems?: TrendingItem[];
}) {
  const analytics = useAnalytics();

  if (featureFlags.enableSampleSearchResponse && sampleSearchResponse) {
    return (
      <SearchResponseExperience
        featureFlags={featureFlags}
        capabilities={capabilities}
        development={development}
        environment={environment}
        insightsContent={insightsContent}
        logger={logger}
        profile={profile}
        scenario={scenario}
        searchResponse={sampleSearchResponse}
        suggestedQueries={suggestedQueries}
        generativeFixture={generativeFixture}
        trendingItems={trendingItems}
      />
    );
  }

  async function handleInitialSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submittedQuery = pendingQuery.trim();

    analytics.track("search_submitted", { mode: "live", query: submittedQuery });
    onEngineStateChange({ status: "loading" });

    try {
      const config = await fetchSearchTokenConfig();
      const engine = createEngine(config);

      logger.info("provider_initialized", { mode: "live", organizationId: config.organizationId });
      onEngineStateChange({ status: "ready", engine, config, initialQuery: submittedQuery });
    } catch (error) {
      logger.error("provider_initialization_failed", error, { mode: "live" });
      onEngineStateChange({ status: "configuration-error" });
    }
  }

  if (engineState.status === "loading") {
    return (
      <StartupSearchView
        notice={
          <ConfigurationNotice
            message="Preparing the secured Coveo search session."
            title="Initializing secure search"
            variant="loading"
          />
        }
        searchSlot={
          <StartupSearchForm
            isLoading
            onQueryChange={onPendingQueryChange}
            onSubmit={handleInitialSearch}
            query={pendingQuery}
          />
        }
      />
    );
  }

  if (engineState.status === "configuration-error") {
    return (
      <StartupSearchView
        notice={
          <ConfigurationNotice
            message="Update the Coveo values in .env.local, then restart the development server."
            title="Search configuration required"
            variant="configuration"
          />
        }
        searchSlot={
          <StartupSearchForm
            onQueryChange={onPendingQueryChange}
            onSubmit={handleInitialSearch}
            query={pendingQuery}
          />
        }
      />
    );
  }

  if (engineState.status === "ready") {
    return (
      <ReadySearchExperience
        config={engineState.config}
        engine={engineState.engine}
        featureFlags={featureFlags}
        capabilities={capabilities}
        initialQuery={engineState.initialQuery}
        insightsContent={insightsContent}
        logger={logger}
      />
    );
  }

  return (
    <StartupSearchView
      searchSlot={
        <StartupSearchForm
          onQueryChange={onPendingQueryChange}
          onSubmit={handleInitialSearch}
          query={pendingQuery}
        />
      }
    />
  );
}

function StartupSearchView({
  notice,
  searchSlot,
}: {
  notice?: ReactNode;
  searchSlot: ReactNode;
}) {
  return (
    <>
      <div className="search-command-bar">{searchSlot}</div>
      <main className="app-shell startup-shell">
        <section className="startup-card">
          <p className="eyebrow">{SEARCH_UI.startup.eyebrow}</p>
          <h1>{SEARCH_UI.startup.title}</h1>
          <p>{SEARCH_UI.startup.body}</p>
          {notice}
        </section>
      </main>
    </>
  );
}

function StartupSearchForm({
  isLoading = false,
  onQueryChange,
  onSubmit,
  query,
}: {
  isLoading?: boolean;
  onQueryChange: (query: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  query: string;
}) {
  return (
    <form className="search-box" onSubmit={onSubmit} role="search">
      <Search aria-hidden="true" size={22} />
      <input
        aria-label="Search"
        autoComplete="off"
        autoFocus
        disabled={isLoading}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={SEARCH_UI.defaultQuery}
        type="search"
        value={query}
      />
      <button aria-label="Search" className="primary-button" disabled={isLoading} type="submit">
        <Search aria-hidden="true" size={22} />
      </button>
    </form>
  );
}

function ReadySearchExperience({
  config,
  engine,
  featureFlags,
  capabilities,
  initialQuery,
  insightsContent,
  logger,
}: {
  config: SearchTokenConfig;
  engine: SearchEngine;
  featureFlags: SearchFeatureFlags;
  capabilities: {
    search: SearchProviderCapabilities;
    generative: GenerativeProviderCapabilities;
  };
  initialQuery: string;
  insightsContent?: SearchInsightsContent;
  logger: Logger;
}) {
  const analytics = useAnalytics();
  const firstSearchExecuted = useRef(false);
  const trackedZeroResults = useRef("");

  const controllers = useMemo(
    () => createControllers(engine, config.facetFields),
    [engine, config.facetFields],
  );

  const searchStatus = useControllerState(controllers.searchStatus);
  const resultListState = useControllerState(controllers.resultList);
  const queryError = useControllerState(controllers.queryError);
  const showInsights = featureFlags.enableInsightsRail && Boolean(insightsContent);
  const generativeProvider = useMemo(() => new CoveoGenerativeProvider(), []);
  const feedbackProvider = useMemo(() => new InMemoryFeedbackProvider(), []);
  const trendingProvider = useMemo(() => new MockTrendingProvider(), []);

  useEffect(() => {
    logger.info("provider_initialized", { mode: "live", searchHub: config.searchHub });
  }, [config.searchHub, logger]);

  useEffect(() => {
    if (!firstSearchExecuted.current) {
      firstSearchExecuted.current = true;

      if (initialQuery) {
        controllers.searchBox.updateText(initialQuery);
        controllers.searchBox.submit();
        return;
      }

      engine.executeFirstSearch();
    }
  }, [controllers.searchBox, engine, initialQuery]);

  useEffect(() => {
    if (
      !resultListState.firstSearchExecuted ||
      resultListState.hasResults ||
      resultListState.isLoading
    ) {
      return;
    }

    const key = controllers.searchBox.state.value.trim();

    if (trackedZeroResults.current === key) {
      return;
    }

    trackedZeroResults.current = key;
    analytics.track("zero_results_displayed", { mode: "live", query: key });
  }, [
    analytics,
    controllers.searchBox,
    resultListState.firstSearchExecuted,
    resultListState.hasResults,
    resultListState.isLoading,
  ]);

  return (
    <>
      <div className="search-command-bar">
        <SearchBoxView
          controller={controllers.searchBox}
          onSearchSubmitted={(query) =>
            analytics.track("search_submitted", { mode: "live", query, searchHub: config.searchHub })
          }
          onSuggestionSelected={(suggestion) =>
            analytics.track("query_suggestion_selected", {
              mode: "live",
              suggestion,
              searchHub: config.searchHub,
            })
          }
        />
      </div>
      <main className="app-shell">
        {queryError.hasError ? (
          <div className="inline-error" role="alert">
            <AlertCircle aria-hidden="true" size={18} />
            <span>{toApplicationError(queryError.error).userMessage}</span>
          </div>
        ) : null}

        <div className="search-context-row">
          <span>{config.searchHub || "default-search-hub"}</span>
        </div>

        <div className={getSearchLayoutClassName(featureFlags.enableFacets, showInsights)}>
          {featureFlags.enableFacets && capabilities.search.facets ? (
            <aside className="facet-sidebar" aria-label="Search filters">
              <div className="facet-sidebar-header">
                <h2>{SEARCH_UI.facets.title}</h2>
                <button
                  className="link-button"
                  onClick={() => {
                    analytics.track("filters_cleared", { mode: "live", searchHub: config.searchHub });
                    controllers.facets.forEach((facet) => facet.controller.deselectAll());
                  }}
                  type="button"
                >
                  {SEARCH_UI.facets.clearAllLabel}
                </button>
              </div>
              {controllers.facets.map((facet) => (
                <FacetPanel
                  key={facet.field}
                  field={facet.field}
                  controller={facet.controller}
                  onClearFacet={(field) =>
                    analytics.track("facet_removed", { field, mode: "live", searchHub: config.searchHub })
                  }
                  onToggleValue={(field, value, selected) =>
                    analytics.track(selected ? "facet_selected" : "facet_removed", {
                      field,
                      mode: "live",
                      searchHub: config.searchHub,
                      value,
                    })
                  }
                />
              ))}
            </aside>
          ) : null}

          <section className="results-column" aria-busy={searchStatus.isLoading}>
            <div className="results-toolbar">
              <SearchSummary controller={controllers.querySummary} />
              <div className="sort-control">
                <span>{SEARCH_UI.sort.label}</span>
                <span className="sort-readonly">{SEARCH_UI.sort.relevanceLabel}</span>
              </div>
            </div>
            <GenerativeAnswer
              feedbackProvider={feedbackProvider}
              featureFlags={{
                ...featureFlags,
                enableGenerativeAnswers:
                  featureFlags.enableGenerativeAnswers && capabilities.generative.available,
                enableGenerativeCitations:
                  featureFlags.enableGenerativeCitations && capabilities.generative.citations,
                enableGenerativeFeedback:
                  featureFlags.enableGenerativeFeedback &&
                  capabilities.generative.feedbackPersistence,
                enableGenerativeStreaming:
                  featureFlags.enableGenerativeStreaming && capabilities.generative.streaming,
              }}
              provider={generativeProvider}
              query={controllers.searchBox.state.value}
            />
            <ResultListView
              engine={engine}
              controller={controllers.resultList}
              onResultSelect={(result, position, resultQuery) =>
                analytics.track("result_clicked", {
                  mode: "live",
                  position,
                  query: resultQuery,
                  resultId: result.uniqueId,
                  searchHub: config.searchHub,
                  type: typeof result.raw.filetype === "string" ? result.raw.filetype : "unknown",
                })
              }
              query={controllers.searchBox.state.value}
            />
            <PagerControls
              controller={controllers.pager}
              onPageChanged={(page) =>
                analytics.track("page_changed", {
                  mode: "live",
                  page,
                  query: controllers.searchBox.state.value,
                  searchHub: config.searchHub,
                })
              }
            />
          </section>

          {showInsights && insightsContent ? (
            <SearchInsightsRail
              content={insightsContent}
              featureFlags={featureFlags}
              trendingProvider={trendingProvider}
            />
          ) : null}
        </div>
      </main>
    </>
  );
}

function SearchResponseExperience({
  capabilities,
  development,
  environment,
  featureFlags,
  generativeFixture,
  insightsContent,
  logger,
  profile,
  scenario,
  searchResponse,
  suggestedQueries,
  trendingItems,
}: {
  capabilities: {
    search: SearchProviderCapabilities;
    generative: GenerativeProviderCapabilities;
  };
  development: { queryOverridesEnabled: boolean };
  environment: "development" | "test" | "production";
  featureFlags: SearchFeatureFlags;
  generativeFixture?: Omit<GenerativeAnswerModel, "id" | "query">;
  insightsContent?: SearchInsightsContent;
  logger: Logger;
  profile?: DemoProfile;
  scenario: DevelopmentScenario;
  searchResponse: SearchResponse;
  suggestedQueries?: string[];
  trendingItems?: TrendingItem[];
}) {
  const analytics = useAnalytics();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    feedbackProvider,
    generativeProvider,
    searchProvider: provider,
    trendingProvider,
  } = useSampleExperienceProviders({
    generativeFixture,
    scenario,
    searchResponse,
    suggestedQueries,
    trendingItems,
  });
  const trackedZeroResults = useRef("");
  const lastUrlState = useRef("");
  const searchRequestId = useRef(0);
  const searchAbortController = useRef<AbortController | null>(null);
  const allowDevelopmentParameters = environment !== "production" && development.queryOverridesEnabled;
  const parsedUrlState = parseSearchUrlState(searchParams, {
    allowDevelopmentParameters,
    allowedFacets: DEFAULT_URL_FACETS,
  });
  const initialQuery = searchQueryFromUrlState({
    ...parsedUrlState,
    query: parsedUrlState.query ?? searchResponse.query ?? DEFAULT_SEARCH_QUERY.query,
  });
  const [draftQuery, setDraftQuery] = useState(initialQuery.query);
  const [query, setQuery] = useState(() => normalizeSearchQuery(initialQuery));
  const [state, dispatch] = useReducer(searchStateReducer, {
    query,
    response: {
      ...searchResponse,
      results: searchResponse.results.slice(0, query.pageSize),
      totalCount: searchResponse.results.length,
    },
    status: searchResponse.results.length === 0 ? "empty" : "success",
  });
  const showInsights = featureFlags.enableInsightsRail && Boolean(insightsContent);
  const response = getSearchStateResponse(state);
  const pagination = getPaginationState({
    page: state.query.page,
    pageSize: state.query.pageSize,
    totalCount: response?.totalCount ?? 0,
  });
  const activeFilterCount = Object.values(state.query.filters).reduce(
    (count, values) => count + values.length,
    0,
  );
  const sortedFacets = (response?.facets ?? [])
    .filter((facet) => isFacetEnabled(facet.field, featureFlags, profile))
    .map((facet) => ({
      ...facet,
      label: getFacetLabel(facet.field, facet.label),
    }))
    .sort((left, right) => getFacetOrder(left.field) - getFacetOrder(right.field));

  useEffect(() => {
    logger.info("provider_initialized", {
      mode: "sample",
      profile: profile?.id,
      scenario,
    });
  }, [logger, profile?.id, scenario]);

  useEffect(() => {
    return () => {
      searchAbortController.current?.abort();
    };
  }, []);

  useEffect(() => {
    analytics.track("feature_flag_exposure", {
      analytics: featureFlags.enableAnalytics,
      facets: featureFlags.enableFacets,
      generative: featureFlags.enableGenerativeAnswers,
      profile: profile?.id,
      scenario,
      trending: featureFlags.enableTrendingContent,
    });
  }, [
    analytics,
    featureFlags.enableAnalytics,
    featureFlags.enableFacets,
    featureFlags.enableGenerativeAnswers,
    featureFlags.enableTrendingContent,
    profile?.id,
    scenario,
  ]);

  useEffect(() => {
    const nextQuery = searchQueryFromUrlState({
      ...parsedUrlState,
      query: parsedUrlState.query ?? searchResponse.query ?? DEFAULT_SEARCH_QUERY.query,
    });
    const serialized = serializeSearchUrlState(
      {
        ...searchUrlStateFromQuery(nextQuery, {
          profile: parsedUrlState.profile,
          scenario: parsedUrlState.scenario,
        }),
        query: parsedUrlState.query,
      },
      {
        includeDevelopmentParameters: allowDevelopmentParameters,
      },
    );
    const current = searchParams.toString();

    if (current !== serialized) {
      logger.warn("invalid_url_state_normalized", { current, normalized: serialized });
      router.replace(serialized ? `?${serialized}` : "/");
      return;
    }

    if (lastUrlState.current === current) {
      return;
    }

    lastUrlState.current = current;
    setDraftQuery(nextQuery.query);
    runSearch(nextQuery, { updateUrl: false });
    // The effect is keyed to the App Router search-param snapshot; adding derived objects here
    // causes redundant provider searches and router writes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (state.status !== "empty") {
      return;
    }

    const key = JSON.stringify({ filters: state.query.filters, query: state.query.query });

    if (trackedZeroResults.current === key) {
      return;
    }

    trackedZeroResults.current = key;
    analytics.track("zero_results_displayed", {
      activeFilterCount,
      mode: "sample",
      query: state.query.query,
    });
  }, [activeFilterCount, analytics, state]);

  function runSearch(nextQuery: typeof query, options: { updateUrl?: boolean } = {}) {
    const normalizedQuery = normalizeSearchQuery(nextQuery);
    searchRequestId.current += 1;
    const currentRequestId = searchRequestId.current;
    searchAbortController.current?.abort();
    const abortController = new AbortController();
    searchAbortController.current = abortController;
    setQuery(normalizedQuery);
    dispatch({ type: "search-requested", query: normalizedQuery });
    logger.info("search_started", {
      mode: "sample",
      query: normalizedQuery.query,
      scenario,
    });

    if (options.updateUrl !== false) {
      const serialized = serializeSearchUrlState(searchUrlStateFromQuery(normalizedQuery, {
        profile: parsedUrlState.profile,
        scenario: parsedUrlState.scenario,
      }), {
        includeDevelopmentParameters: allowDevelopmentParameters,
      });
      lastUrlState.current = serialized;
      router.push(serialized ? `?${serialized}` : "/");
    }

    if (scenario === "error") {
      const error = new Error("Scenario search provider failure.");
      logger.error("search_failed", error, { mode: "sample", query: normalizedQuery.query });
      dispatch({ type: "search-failed", error: toApplicationError(error).userMessage });
      return;
    }

    if (scenario === "loading") {
      return;
    }

    provider
      .search(
        scenario === "empty" ? { ...normalizedQuery, query: "no matching scenario query" } : normalizedQuery,
        { signal: abortController.signal },
      )
      .then((nextResponse) => {
        if (searchRequestId.current !== currentRequestId || abortController.signal.aborted) {
          return;
        }

        const scenarioResponse =
          scenario === "partial"
            ? {
                ...nextResponse,
                facets: nextResponse.facets.slice(0, 1),
                results: nextResponse.results.slice(0, 2),
                totalCount: Math.min(nextResponse.totalCount, 2),
              }
            : nextResponse;

        logger.info("search_completed", {
          mode: "sample",
          query: normalizedQuery.query,
          resultCount: scenarioResponse.totalCount,
        });
        dispatch({ type: "search-succeeded", response: scenarioResponse });
      })
      .catch((error: unknown) => {
        if (searchRequestId.current !== currentRequestId || abortController.signal.aborted) {
          return;
        }

        logger.error("search_failed", error, { mode: "sample", query: normalizedQuery.query });
        dispatch({
          type: "search-failed",
          error: toApplicationError(error).userMessage,
        });
      });
  }

  function submitSearch(nextQueryText: string) {
    analytics.track("search_submitted", { mode: "sample", query: nextQueryText });
    runSearch(setSearchQueryText(query, nextQueryText));
  }

  function clearSearch() {
    setDraftQuery("");
  }

  function trackResultClick(result: SearchResult, position: number, resultQuery: string) {
    analytics.track(
      "result_clicked",
      createSearchAnalyticsPayload({
        position,
        query: resultQuery,
        resultId: result.id,
        searchHub: searchResponse.searchHub,
        type: result.type,
      }),
    );
  }

  return (
    <>
      <div className="search-command-bar">
        <SearchBox
          isLoading={state.status === "loading"}
          onClear={clearSearch}
          onQueryChange={setDraftQuery}
          onSuggestionSelected={(suggestion) =>
            analytics.track("query_suggestion_selected", {
              mode: "sample",
              query: draftQuery,
              suggestionId: suggestion.id,
              suggestion: suggestion.value,
            })
          }
          onSubmit={submitSearch}
          provider={provider}
          query={draftQuery}
        />
      </div>

      <main className="app-shell">
        <div className="search-context-row">
          <span>{searchResponse.searchHub}</span>
        </div>

        <div className={getSearchLayoutClassName(featureFlags.enableFacets, showInsights)}>
          {featureFlags.enableFacets && sortedFacets.length > 0 ? (
            <DomainFacetPanel
              facets={sortedFacets}
              onClearAll={() => {
                analytics.track("filters_cleared", {
                  activeFilterCount,
                  mode: "sample",
                  query: query.query,
                });
                runSearch(clearSearchQueryFilters(query));
              }}
              onClearFacet={(field) => {
                analytics.track("facet_removed", { field, mode: "sample", query: query.query });
                runSearch(clearSearchQueryFacet(query, field));
              }}
              onToggleValue={(field, value) => {
                if (value.toLowerCase() === "all" || value.toLowerCase() === "any time") {
                  analytics.track("facet_removed", { field, mode: "sample", query: query.query });
                  runSearch(clearSearchQueryFacet(query, field));
                  return;
                }

                const selectedValues = query.filters[field] ?? [];
                analytics.track(
                  selectedValues.includes(value) ? "facet_removed" : "facet_selected",
                  { field, mode: "sample", query: query.query, value },
                );
                runSearch(toggleSearchQueryFacet(query, field, value));
              }}
            />
          ) : null}

          <section className="results-column" aria-busy={state.status === "loading"} tabIndex={-1}>
            <div className="results-toolbar">
              <DomainSearchStatus
                durationMs={response?.durationMs}
                isLoading={state.status === "loading"}
                pagination={pagination}
                query={state.query.query}
              />
              <SortControl
                onChange={(sort) => {
                  analytics.track("sort_changed", {
                    mode: "sample",
                    query: query.query,
                    sort,
                  });
                  runSearch(setSearchQuerySort(query, sort));
                }}
                options={profile?.id === "minimal" ? ["relevance"] : capabilities.search.sorting}
                value={state.query.sort}
              />
            </div>
            <GenerativeAnswer
              feedbackProvider={feedbackProvider}
              featureFlags={{
                ...featureFlags,
                enableGenerativeAnswers:
                  featureFlags.enableGenerativeAnswers && capabilities.generative.available,
                enableGenerativeCitations:
                  featureFlags.enableGenerativeCitations && capabilities.generative.citations,
                enableGenerativeFeedback: featureFlags.enableGenerativeFeedback,
                enableGenerativeStreaming:
                  featureFlags.enableGenerativeStreaming && capabilities.generative.streaming,
              }}
              provider={generativeProvider}
              query={state.query.query}
            />
            <SearchResults
              activeFilterCount={activeFilterCount}
              error={state.status === "error" ? state.error : undefined}
              isLoading={state.status === "loading"}
              onClearFilters={() => {
                analytics.track("filters_cleared", {
                  activeFilterCount,
                  mode: "sample",
                  query: query.query,
                });
                runSearch(clearSearchQueryFilters(query));
              }}
              onResultSelect={trackResultClick}
              onRetryQuery={(nextQuery) => {
                setDraftQuery(nextQuery);
                analytics.track("search_submitted", { mode: "sample", query: nextQuery });
                runSearch(setSearchQueryText(query, nextQuery));
              }}
              pagination={pagination}
              query={state.query.query}
              response={response}
              showStatus={false}
            />
            <Pagination
              onSelectPage={(page) => {
                analytics.track("page_changed", {
                  mode: "sample",
                  page,
                  query: query.query,
                });
                runSearch(setSearchQueryPage(query, page));
                window.requestAnimationFrame(() => {
                  document.querySelector<HTMLElement>(".results-column")?.focus();
                });
              }}
              pagination={pagination}
            />
          </section>

          {showInsights && insightsContent ? (
            <SearchInsightsRail
              content={insightsContent}
              featureFlags={featureFlags}
              trendingProvider={trendingProvider}
            />
          ) : null}
        </div>
        {environment !== "production" ? (
          <div className="search-context-row" aria-label="Development context">
            <span>{profile?.name ?? "Default profile"}</span>
            <span>{scenario}</span>
          </div>
        ) : null}
      </main>
    </>
  );
}

function isFacetEnabled(field: string, featureFlags: SearchFeatureFlags, profile?: DemoProfile) {
  if (!featureFlags.enableFacets) {
    return false;
  }

  if (profile?.facetConfiguration.length) {
    return profile.facetConfiguration.some((facet) => facet.field === field && facet.enabled);
  }

  return ["filetype", "source", "product"].includes(field);
}

function getSearchLayoutClassName(showFacets: boolean, showInsights: boolean) {
  return [
    "search-layout",
    !showFacets ? "search-layout-no-facets" : "",
    !showInsights ? "search-layout-no-insights" : "",
  ]
    .filter(Boolean)
    .join(" ");
}
