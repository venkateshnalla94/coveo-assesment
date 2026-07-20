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
  type Facet,
  type Pager,
  type QueryError,
  type QuerySummary,
  type ResultList,
  type SearchBox,
  type SearchEngine,
  type SearchStatus,
} from "@coveo/headless";
import { AlertCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { FacetPanel } from "@/components/search/facets/FacetPanel";
import { PagerControls } from "@/components/search/PagerControls";
import { ResultListView } from "@/components/search/results/ResultListView";
import { SearchBoxView } from "@/components/search/SearchBoxView";
import { SearchSummary } from "@/components/search/SearchSummary";
import { fetchSearchTokenConfig, type SearchTokenConfig } from "@/lib/coveo/search-token";
import { useControllerState } from "@/lib/coveo/use-controller-state";

type EngineState =
  | { status: "loading" }
  | { status: "ready"; engine: SearchEngine; config: SearchTokenConfig }
  | { status: "error"; message: string };

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

export function SearchExperience() {
  const [engineState, setEngineState] = useState<EngineState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        const config = await fetchSearchTokenConfig();
        const engine = createEngine(config);

        if (!cancelled) {
          setEngineState({ status: "ready", engine, config });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to start search.";

        if (!cancelled) {
          setEngineState({ status: "error", message });
        }
      }
    }

    initialize();

    return () => {
      cancelled = true;
    };
  }, []);

  if (engineState.status === "loading") {
    return (
      <main className="app-shell">
        <section className="search-surface" aria-busy="true">
          <div className="loading-block">
            <span className="spinner" />
            <span>Initializing secure search</span>
          </div>
        </section>
      </main>
    );
  }

  if (engineState.status === "error") {
    return (
      <main className="app-shell">
        <section className="search-surface error-surface">
          <AlertCircle aria-hidden="true" size={22} />
          <div>
            <h1>Search is not configured</h1>
            <p>{engineState.message}</p>
          </div>
        </section>
      </main>
    );
  }

  return <ReadySearchExperience engine={engineState.engine} config={engineState.config} />;
}

function ReadySearchExperience({ engine, config }: { engine: SearchEngine; config: SearchTokenConfig }) {
  const firstSearchExecuted = useRef(false);

  const controllers = useMemo(
    () => createControllers(engine, config.facetFields),
    [engine, config.facetFields],
  );

  const searchStatus = useControllerState(controllers.searchStatus);
  const queryError = useControllerState(controllers.queryError);

  useEffect(() => {
    if (!firstSearchExecuted.current) {
      firstSearchExecuted.current = true;
      engine.executeFirstSearch();
    }
  }, [engine]);

  return (
    <main className="app-shell">
      <section className="search-surface">
        <header className="app-header">
          <div>
            <p className="eyebrow">Coveo TME Assessment</p>
            <h1>Secure Headless Search</h1>
          </div>
          <div className="context-pill">{config.searchHub || "default-search-hub"}</div>
        </header>

        <SearchBoxView controller={controllers.searchBox} />

        {queryError.hasError ? (
          <div className="inline-error" role="alert">
            <AlertCircle aria-hidden="true" size={18} />
            <span>{queryError.error?.message ?? "Coveo returned an error for this query."}</span>
          </div>
        ) : null}

        <SearchSummary controller={controllers.querySummary} />

        <div className="search-layout">
          <aside className="facet-sidebar" aria-label="Search filters">
            {controllers.facets.map((facet) => (
              <FacetPanel key={facet.field} field={facet.field} controller={facet.controller} />
            ))}
          </aside>

          <section className="results-column" aria-busy={searchStatus.isLoading}>
            <ResultListView engine={engine} controller={controllers.resultList} />
            <PagerControls controller={controllers.pager} />
          </section>
        </div>
      </section>
    </main>
  );
}
