"use client";

import {
  buildCommerceEngine,
  buildRelevanceSortCriterion,
  buildSearch,
  buildSearchBox,
  getOrganizationEndpoints,
  type CategoryFacet,
  type CommerceEngine,
  type FacetGenerator,
  type NumericFacet,
  type Pagination,
  type RegularFacet,
  type Search,
  type SearchBox,
  type Sort,
  type Summary,
} from "@coveo/headless/commerce";
import type { CurrencyCodeISO4217 } from "@coveo/relay-event-types";
import { useEffect, useMemo, useRef, useState } from "react";

import { COMMERCE_DEFAULTS } from "@/features/commerce/config/commerce-config";
import type { HeadlessCommerceAuthConfig } from "@/features/commerce/headless/commerce-auth";
import {
  mapHeadlessFacets,
  mapHeadlessPagination,
  mapHeadlessProduct,
} from "@/features/commerce/headless/headless-commerce-mappers";
import type { ProductSearchResponse } from "@/features/commerce/models/commerce-models";
import type { SearchSuggestion } from "@/features/search/models/search-models";
import { fetchSearchTokenConfig } from "@/lib/coveo/search-token";

const SUGGESTION_WAIT_TIMEOUT_MS = 900;

type CommerceControllerBundle = {
  engine: CommerceEngine;
  search: Search;
  searchBox: SearchBox;
  pagination: Pagination;
  summary: Summary;
  sort: Sort;
  facetGenerator: FacetGenerator;
};

type CommerceAdapterSnapshot =
  | {
      status: "loading";
      query: string;
      response?: ProductSearchResponse;
    }
  | {
      status: "success";
      query: string;
      response: ProductSearchResponse;
    }
  | {
      status: "empty";
      query: string;
      response: ProductSearchResponse;
    }
  | {
      status: "error";
      message: string;
      query: string;
      response?: ProductSearchResponse;
    };

export function useHeadlessCommerce({
  authConfig,
  enabled,
  initialQuery = "welding arm",
}: {
  authConfig: HeadlessCommerceAuthConfig;
  enabled: boolean;
  initialQuery?: string;
}) {
  const bundleRef = useRef<CommerceControllerBundle | null>(null);
  const [snapshot, setSnapshot] = useState<CommerceAdapterSnapshot>(() =>
    authConfig.mode === "configuration-error"
      ? {
          message: authConfig.message,
          query: initialQuery,
          status: "error",
        }
      : {
          query: initialQuery,
          status: "loading",
        },
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (authConfig.mode === "configuration-error") {
      return;
    }

    let isCurrent = true;
    let snapshotTimer: number | undefined;
    let unsubscribe: (() => void) | undefined;

    resolveCommerceAuth(authConfig)
      .then((resolvedAuth) => {
        if (!isCurrent) {
          return;
        }

        const bundle = createCommerceControllers({
          organizationId: resolvedAuth.organizationId,
          renewAccessToken: resolvedAuth.renewAccessToken,
          token: resolvedAuth.token,
        });
        bundleRef.current = bundle;

        const updateSnapshot = () => {
          if (isCurrent) {
            setSnapshot(readCommerceSnapshot(bundle));
          }
        };
        const scheduleSnapshot = () => {
          if (snapshotTimer !== undefined) {
            return;
          }

          snapshotTimer = window.setTimeout(() => {
            snapshotTimer = undefined;
            updateSnapshot();
          }, 0);
        };
        unsubscribe = bundle.engine.subscribe(scheduleSnapshot);

        bundle.searchBox.updateText(initialQuery);
        bundle.pagination.setPageSize(COMMERCE_DEFAULTS.perPage);
        updateSnapshot();
        bundle.searchBox.submit();

      })
      .catch(() => {
        if (isCurrent) {
          setSnapshot({
            message: "Product search could not be initialized.",
            query: initialQuery,
            status: "error",
          });
        }
      });

    return () => {
      isCurrent = false;
      if (snapshotTimer !== undefined) {
        window.clearTimeout(snapshotTimer);
      }
      unsubscribe?.();
      bundleRef.current = null;
    };
  }, [authConfig, enabled, initialQuery]);

  const suggestionsProvider = useMemo(
    () => ({
      getSuggestions: async (query: string, options?: { signal?: AbortSignal }) => {
        const bundle = bundleRef.current;

        if (!bundle || options?.signal?.aborted) {
          return [];
        }

        bundle.searchBox.updateText(query);
        bundle.searchBox.showSuggestions();

        return waitForSuggestions(bundle.searchBox, options?.signal);
      },
    }),
    [],
  );

  return {
    clearAllFacets: () => bundleRef.current?.facetGenerator.deselectAll(),
    clearFacet: (field: string) => {
      for (const facet of bundleRef.current?.facetGenerator.facets ?? []) {
        if (facet.state.field === field) {
          facet.deselectAll();
        }
      }
    },
    clearQuery: () => bundleRef.current?.searchBox.clear(),
    selectPage: (page: number) => bundleRef.current?.pagination.selectPage(Math.max(0, page)),
    submitSearch: (query: string) => {
      const trimmedQuery = query.trim();

      if (!trimmedQuery) {
        return;
      }

      const bundle = bundleRef.current;
      bundle?.searchBox.updateText(trimmedQuery);
      bundle?.searchBox.submit();
    },
    suggestionsProvider,
    toggleFacetValue: (field: string, value: string, type: "regular" | "hierarchical") => {
      toggleFacetValue(bundleRef.current?.facetGenerator.facets ?? [], field, value, type);
    },
    toggleRange: (field: string, start: number, end: number) => {
      toggleRangeValue(bundleRef.current?.facetGenerator.facets ?? [], field, start, end);
    },
    updateQuery: (query: string) => bundleRef.current?.searchBox.updateText(query),
    ...snapshot,
  };
}

function createCommerceControllers({
  organizationId,
  renewAccessToken,
  token,
}: {
  organizationId: string;
  renewAccessToken?: () => Promise<string>;
  token: string;
}): CommerceControllerBundle {
  const engine = buildCommerceEngine({
    configuration: {
      accessToken: token,
      analytics: {
        enabled: true,
        originContext: "Search",
        trackingId: COMMERCE_DEFAULTS.trackingId,
      },
      context: {
        country: COMMERCE_DEFAULTS.country,
        currency: COMMERCE_DEFAULTS.currency as CurrencyCodeISO4217,
        language: COMMERCE_DEFAULTS.language,
        view: {
          url: COMMERCE_DEFAULTS.viewUrl,
        },
      },
      organizationId,
      organizationEndpoints: getOrganizationEndpoints(organizationId),
      ...(renewAccessToken ? { renewAccessToken } : {}),
    },
  });
  const search = buildSearch(engine);
  const searchBox = buildSearchBox(engine);
  const pagination = search.pagination({
    options: {
      pageSize: COMMERCE_DEFAULTS.perPage,
    },
  });

  return {
    engine,
    facetGenerator: search.facetGenerator(),
    pagination,
    search,
    searchBox,
    sort: search.sort({
      initialState: {
        criterion: buildRelevanceSortCriterion(),
      },
    }),
    summary: search.summary(),
  };
}

async function resolveCommerceAuth(authConfig: HeadlessCommerceAuthConfig): Promise<{
  organizationId: string;
  renewAccessToken?: () => Promise<string>;
  token: string;
}> {
  if (authConfig.mode === "anonymous-api-key") {
    return {
      organizationId: authConfig.organizationId,
      token: authConfig.accessToken,
    };
  }

  if (authConfig.mode === "configuration-error") {
    throw new Error(authConfig.message);
  }

  const config = await fetchSearchTokenConfig();

  return {
    organizationId: config.organizationId,
    renewAccessToken: async () => {
      const renewedConfig = await fetchSearchTokenConfig();
      return renewedConfig.token;
    },
    token: config.token,
  };
}

function readCommerceSnapshot(bundle: CommerceControllerBundle): CommerceAdapterSnapshot {
  const query = bundle.searchBox.state.value;
  const response = buildSearchResponse(bundle);

  if (bundle.search.state.error) {
    return {
      message: "Product search could not be loaded.",
      query,
      response,
      status: "error",
    };
  }

  if (bundle.search.state.isLoading && !bundle.summary.state.firstRequestExecuted) {
    return {
      query,
      status: "loading",
    };
  }

  if (bundle.search.state.isLoading) {
    return {
      query,
      response,
      status: "loading",
    };
  }

  return {
    query,
    response,
    status: response.products.length === 0 ? "empty" : "success",
  };
}

function buildSearchResponse(bundle: CommerceControllerBundle): ProductSearchResponse {
  const products = bundle.search.state.products.map(mapHeadlessProduct);
  const pagination = mapHeadlessPagination(bundle.pagination.state);

  return {
    appliedSort: "relevance",
    availableSorts: bundle.sort.state.availableSorts.length > 0 ? ["relevance"] : ["relevance"],
    facets: mapHeadlessFacets(bundle.facetGenerator.facets),
    pagination,
    products,
    totalCount: bundle.summary.state.totalNumberOfProducts,
  };
}

function toggleFacetValue(
  facets: FacetGenerator["facets"],
  field: string,
  value: string,
  type: "regular" | "hierarchical",
) {
  const facet = facets.find((item) => item.state.field === field && item.state.type === type);

  if (!facet) {
    return;
  }

  if (type === "regular") {
    const regularValue = (facet as RegularFacet).state.values.find((item) => item.value === value);

    if (regularValue) {
      (facet as RegularFacet).toggleSelect(regularValue);
    }
    return;
  }

  const categoryValue = (facet as CategoryFacet).state.values.find((item) => item.value === value);

  if (categoryValue) {
    (facet as CategoryFacet).toggleSelect(categoryValue);
  }
}

function toggleRangeValue(facets: FacetGenerator["facets"], field: string, start: number, end: number) {
  const facet = facets.find((item) => item.state.field === field && item.state.type === "numericalRange");
  const value = (facet as NumericFacet | undefined)?.state.values.find(
    (item) => item.start === start && item.end === end,
  );

  if (value) {
    (facet as NumericFacet).toggleSelect(value);
  }
}

function waitForSuggestions(searchBox: SearchBox, signal?: AbortSignal): Promise<SearchSuggestion[]> {
  return new Promise((resolve) => {
    const timers: { timeout?: number } = {};
    let hasFinished = false;
    let sawLoading = searchBox.state.isLoadingSuggestions;
    const finish = () => {
      if (hasFinished) {
        return;
      }

      hasFinished = true;
      if (timers.timeout) {
        window.clearTimeout(timers.timeout);
      }
      unsubscribe();
      resolve(
        searchBox.state.suggestions.map((suggestion) => ({
          id: `commerce-suggestion-${suggestion.rawValue}`,
          label: suggestion.rawValue,
          value: suggestion.rawValue,
        })),
      );
    };
    const unsubscribe = searchBox.subscribe(() => {
      if (signal?.aborted) {
        finish();
        return;
      }

      if (searchBox.state.isLoadingSuggestions) {
        sawLoading = true;
        return;
      }

      if (sawLoading || searchBox.state.suggestions.length > 0) {
        finish();
      }
    });

    timers.timeout = window.setTimeout(finish, SUGGESTION_WAIT_TIMEOUT_MS);
  });
}
