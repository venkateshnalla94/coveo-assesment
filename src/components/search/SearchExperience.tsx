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
  SearchBox,
  SearchEngine,
  SearchStatus,
} from "@coveo/headless";
import { AlertCircle, ChevronDown, List, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";

import { ConfigurationNotice } from "@/components/shared/ConfigurationNotice";
import { FacetPanel } from "@/components/search/facets/FacetPanel";
import {
  SearchInsightsRail,
  type SearchInsightsContent,
} from "@/components/search/layout/SearchInsightsRail";
import { PagerControls } from "@/components/search/PagerControls";
import { SearchResponseFacetPanel } from "@/components/search/response/SearchResponseFacetPanel";
import { SearchResponsePagerControls } from "@/components/search/response/SearchResponsePagerControls";
import { SearchResponseResultList } from "@/components/search/response/SearchResponseResultList";
import type { CoveoSearchResponse } from "@/components/search/response/search-response-types";
import { useSearchResponseState } from "@/components/search/response/use-search-response-state";
import { ResultListView } from "@/components/search/results/ResultListView";
import { SearchBoxView } from "@/components/search/SearchBoxView";
import { SearchSummary } from "@/components/search/SearchSummary";
import { SEARCH_UI } from "@/components/search/search-ui.constants";
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
  searchBox: SearchBox;
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
  sampleSearchResponse?: CoveoSearchResponse;
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
                <button className="link-button" type="button">
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
                <button type="button">
                  {SEARCH_UI.sort.relevanceLabel}
                  <ChevronDown aria-hidden="true" size={16} />
                </button>
                <button aria-label="List view" className="header-icon-button" type="button">
                  <List aria-hidden="true" size={19} />
                </button>
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
  searchResponse: CoveoSearchResponse;
}) {
  const [query, setQuery] = useState(searchResponse.query);
  const showInsights = featureFlags.enableInsightsRail && Boolean(insightsContent);
  const responseState = useSearchResponseState(searchResponse);

  return (
    <>
      <div className="search-command-bar">
        <StartupSearchForm
          onQueryChange={setQuery}
          onSubmit={(event) => event.preventDefault()}
          query={query}
        />
      </div>

      <main className="app-shell">
        <div className="search-context-row">
          <span>{searchResponse.searchHub}</span>
        </div>

        <div className={getSearchLayoutClassName(featureFlags.enableFacets, showInsights)}>
          {featureFlags.enableFacets ? (
            <aside className="facet-sidebar" aria-label="Search filters">
              <div className="facet-sidebar-header">
                <h2>{SEARCH_UI.facets.title}</h2>
                <button className="link-button" onClick={responseState.clearFacets} type="button">
                  {SEARCH_UI.facets.clearAllLabel}
                </button>
              </div>
              {responseState.facets.map((facet) => (
                <SearchResponseFacetPanel
                  facet={facet}
                  key={facet.field}
                  onToggleValue={responseState.toggleFacetValue}
                />
              ))}
            </aside>
          ) : null}

          <section className="results-column" aria-busy="false">
            <div className="results-toolbar">
              <p className="summary-text">
                Showing {responseState.firstResult}-{responseState.lastResult} of{" "}
                {responseState.totalCount.toLocaleString()} results for{" "}
                <strong>{query || searchResponse.query}</strong> in{" "}
                {searchResponse.durationInSeconds.toFixed(2)}s
              </p>
              <div className="sort-control">
                <span>{SEARCH_UI.sort.label}</span>
                <button type="button">
                  {SEARCH_UI.sort.relevanceLabel}
                  <ChevronDown aria-hidden="true" size={16} />
                </button>
                <button aria-label="List view" className="header-icon-button" type="button">
                  <List aria-hidden="true" size={19} />
                </button>
              </div>
            </div>
            <SearchResponseResultList results={responseState.pagedResults} />
            <SearchResponsePagerControls
              currentPage={responseState.currentPage}
              maxPage={responseState.maxPage}
              onSelectPage={responseState.selectPage}
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
