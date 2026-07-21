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
import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

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
import { getFacetLabel, getFacetOrder } from "@/features/search/config/facets";
import { getSearchStateResponse, searchStateReducer } from "@/features/search/models/search-state";
import { InMemorySearchProvider } from "@/features/search/providers/in-memory-search-provider";
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
  defaultSearchFeatureFlags,
  type SearchFeatureFlags,
} from "@/lib/features/search-feature-flags";
import { fetchSearchTokenConfig, type SearchTokenConfig } from "@/lib/coveo/search-token";
import { useControllerState } from "@/lib/coveo/use-controller-state";

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
  featureFlags = defaultSearchFeatureFlags,
  insightsContent,
  sampleSearchResponse,
}: {
  featureFlags?: SearchFeatureFlags;
  insightsContent?: SearchInsightsContent;
  sampleSearchResponse?: SearchResponse;
}) {
  const [engineState, setEngineState] = useState<EngineState>({ status: "idle" });
  const [pendingQuery, setPendingQuery] = useState("");

  if (featureFlags.enableSampleSearchResponse && sampleSearchResponse) {
    return (
      <SearchResponseExperience
        featureFlags={featureFlags}
        insightsContent={insightsContent}
        searchResponse={sampleSearchResponse}
      />
    );
  }

  async function handleInitialSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submittedQuery = pendingQuery.trim();

    setEngineState({ status: "loading" });

    try {
      const config = await fetchSearchTokenConfig();
      const engine = createEngine(config);

      setEngineState({ status: "ready", engine, config, initialQuery: submittedQuery });
    } catch (error) {
      console.error("Coveo search initialization failed:", error);
      setEngineState({ status: "configuration-error" });
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
            onQueryChange={setPendingQuery}
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
            onQueryChange={setPendingQuery}
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
        initialQuery={engineState.initialQuery}
        insightsContent={insightsContent}
      />
    );
  }

  return (
    <StartupSearchView
      searchSlot={
        <StartupSearchForm
          onQueryChange={setPendingQuery}
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
  initialQuery,
  insightsContent,
}: {
  config: SearchTokenConfig;
  engine: SearchEngine;
  featureFlags: SearchFeatureFlags;
  initialQuery: string;
  insightsContent?: SearchInsightsContent;
}) {
  const firstSearchExecuted = useRef(false);

  const controllers = useMemo(
    () => createControllers(engine, config.facetFields),
    [engine, config.facetFields],
  );

  const searchStatus = useControllerState(controllers.searchStatus);
  const queryError = useControllerState(controllers.queryError);
  const showInsights = featureFlags.enableInsightsRail && Boolean(insightsContent);

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

  return (
    <>
      <div className="search-command-bar">
        <SearchBoxView controller={controllers.searchBox} />
      </div>
      <main className="app-shell">
        {queryError.hasError ? (
          <div className="inline-error" role="alert">
            <AlertCircle aria-hidden="true" size={18} />
            <span>{queryError.error?.message ?? "Coveo returned an error for this query."}</span>
          </div>
        ) : null}

        <div className="search-context-row">
          <span>{config.searchHub || "default-search-hub"}</span>
        </div>

        <div className={getSearchLayoutClassName(featureFlags.enableFacets, showInsights)}>
          {featureFlags.enableFacets ? (
            <aside className="facet-sidebar" aria-label="Search filters">
              <div className="facet-sidebar-header">
                <h2>{SEARCH_UI.facets.title}</h2>
                <button
                  className="link-button"
                  onClick={() => {
                    controllers.facets.forEach((facet) => facet.controller.deselectAll());
                  }}
                  type="button"
                >
                  {SEARCH_UI.facets.clearAllLabel}
                </button>
              </div>
              {controllers.facets.map((facet) => (
                <FacetPanel key={facet.field} field={facet.field} controller={facet.controller} />
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
            <ResultListView engine={engine} controller={controllers.resultList} />
            <PagerControls controller={controllers.pager} />
          </section>

          {showInsights && insightsContent ? (
            <SearchInsightsRail content={insightsContent} featureFlags={featureFlags} />
          ) : null}
        </div>
      </main>
    </>
  );
}

function SearchResponseExperience({
  featureFlags,
  insightsContent,
  searchResponse,
}: {
  featureFlags: SearchFeatureFlags;
  insightsContent?: SearchInsightsContent;
  searchResponse: SearchResponse;
}) {
  const provider = useMemo(() => new InMemorySearchProvider(searchResponse), [searchResponse]);
  const [draftQuery, setDraftQuery] = useState(searchResponse.query ?? "");
  const [query, setQuery] = useState(() =>
    normalizeSearchQuery({
      ...DEFAULT_SEARCH_QUERY,
      query: searchResponse.query ?? DEFAULT_SEARCH_QUERY.query,
    }),
  );
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
    .filter((facet) => ["filetype", "source", "product"].includes(facet.field))
    .map((facet) => ({
      ...facet,
      label: getFacetLabel(facet.field, facet.label),
    }))
    .sort((left, right) => getFacetOrder(left.field) - getFacetOrder(right.field));

  function runSearch(nextQuery: typeof query) {
    const normalizedQuery = normalizeSearchQuery(nextQuery);
    setQuery(normalizedQuery);
    dispatch({ type: "search-requested", query: normalizedQuery });

    provider
      .search(normalizedQuery)
      .then((nextResponse) => {
        dispatch({ type: "search-succeeded", response: nextResponse });
      })
      .catch((error: unknown) => {
        dispatch({
          type: "search-failed",
          error: error instanceof Error ? error.message : "Search failed.",
        });
      });
  }

  function submitSearch(nextQueryText: string) {
    runSearch(setSearchQueryText(query, nextQueryText));
  }

  function clearSearch() {
    setDraftQuery("");
  }

  return (
    <>
      <div className="search-command-bar">
        <SearchBox
          isLoading={state.status === "loading"}
          onClear={clearSearch}
          onQueryChange={setDraftQuery}
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
              onClearAll={() => runSearch(clearSearchQueryFilters(query))}
              onClearFacet={(field) => runSearch(clearSearchQueryFacet(query, field))}
              onToggleValue={(field, value) => {
                if (value.toLowerCase() === "all" || value.toLowerCase() === "any time") {
                  runSearch(clearSearchQueryFacet(query, field));
                  return;
                }

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
                onChange={(sort) => runSearch(setSearchQuerySort(query, sort))}
                value={state.query.sort}
              />
            </div>
            <SearchResults
              activeFilterCount={activeFilterCount}
              error={state.status === "error" ? state.error : undefined}
              isLoading={state.status === "loading"}
              onClearFilters={() => runSearch(clearSearchQueryFilters(query))}
              onRetryQuery={(nextQuery) => {
                setDraftQuery(nextQuery);
                runSearch(setSearchQueryText(query, nextQuery));
              }}
              pagination={pagination}
              query={state.query.query}
              response={response}
              showStatus={false}
            />
            <Pagination
              onSelectPage={(page) => {
                runSearch(setSearchQueryPage(query, page));
                window.requestAnimationFrame(() => {
                  document.querySelector<HTMLElement>(".results-column")?.focus();
                });
              }}
              pagination={pagination}
            />
          </section>

          {showInsights && insightsContent ? (
            <SearchInsightsRail content={insightsContent} featureFlags={featureFlags} />
          ) : null}
        </div>
      </main>
    </>
  );
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
