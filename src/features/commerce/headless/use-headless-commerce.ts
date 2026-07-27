"use client";

import {
  buildCommerceEngine,
  buildRelevanceSortCriterion,
  buildSearch,
  buildSearchBox,
  type CategoryFacet,
  type CommerceEngine,
  type DidYouMean,
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
  getSortCriterionId,
  mapHeadlessFacets,
  mapHeadlessPagination,
  mapHeadlessProduct,
  mapHeadlessSort,
  resolveProductId,
} from "@/features/commerce/headless/headless-commerce-mappers";
import type { Analytics } from "@/features/analytics/analytics";
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
  didYouMean: DidYouMean;
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
  analytics,
  authConfig,
  enabled,
  initialQuery = "welding arm",
}: {
  analytics?: Analytics;
  authConfig: HeadlessCommerceAuthConfig;
  enabled: boolean;
  initialQuery?: string;
}) {
  const bundleRef = useRef<CommerceControllerBundle | null>(null);
  const [retryToken, setRetryToken] = useState(0);
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

    const abortController = new AbortController();
    let isCurrent = true;
    let snapshotTimer: number | undefined;
    let unsubscribe: (() => void) | undefined;

    resolveCommerceAuth(authConfig, { signal: abortController.signal })
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
        analytics?.attachRelay(bundle.engine.relay);

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

        // Page size is already configured via `search.pagination({ options: { pageSize } })` in
        // createCommerceControllers. Calling `pagination.setPageSize` again here is redundant and,
        // worse, triggers the Commerce engine's automatic first-search fetch before `updateText`'s
        // query has been committed via `submit()` — producing an extra empty-query search request.
        bundle.searchBox.updateText(initialQuery);
        updateSnapshot();
        bundle.searchBox.submit();
      })
      .catch((error: unknown) => {
        if (
          isCurrent &&
          !(error instanceof DOMException && error.name === "AbortError")
        ) {
          setSnapshot({
            message: "Product search could not be initialized.",
            query: initialQuery,
            status: "error",
          });
        }
      });

    return () => {
      isCurrent = false;
      abortController.abort();
      if (snapshotTimer !== undefined) {
        window.clearTimeout(snapshotTimer);
      }
      unsubscribe?.();
      analytics?.attachRelay(undefined);
      bundleRef.current = null;
    };
  }, [analytics, authConfig, enabled, initialQuery, retryToken]);

  const suggestionsProvider = useMemo(
    () => ({
      getSuggestions: async (
        query: string,
        options?: { signal?: AbortSignal },
      ) => {
        const bundle = bundleRef.current;

        if (!bundle || options?.signal?.aborted) {
          return [];
        }

        // Text is already kept current on the engine by `updateQuery` on every keystroke;
        // re-setting it here from the (debounced, trimmed) suggestion query would clobber
        // any trailing whitespace the user has since typed.
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
    retry: () => {
      const bundle = bundleRef.current;

      if (bundle) {
        // Re-issues the current query/facet state as-is; no need to rebuild the engine.
        bundle.searchBox.submit();
        return;
      }

      // No bundle means engine/token setup itself failed (e.g. token mint failure). Re-running
      // the init effect re-fetches a fresh token before retrying.
      setRetryToken((count) => count + 1);
    },
    selectPage: (page: number) =>
      bundleRef.current?.pagination.selectPage(Math.max(0, page)),
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
    toggleFacetValue: (
      field: string,
      value: string,
      type: "regular" | "hierarchical",
    ) => {
      toggleFacetValue(
        bundleRef.current?.facetGenerator.facets ?? [],
        field,
        value,
        type,
      );
    },
    toggleRange: (field: string, start: number, end: number) => {
      toggleRangeValue(
        bundleRef.current?.facetGenerator.facets ?? [],
        field,
        start,
        end,
      );
    },
    updateSort: (sortId: string) => {
      const bundle = bundleRef.current;
      const criterion = bundle?.sort.state.availableSorts.find(
        (option) => getSortCriterionId(option) === sortId,
      );

      if (bundle && criterion) {
        bundle.sort.sortBy(criterion);
      }
    },
    trackProductClick: (productId: string) => {
      const bundle = bundleRef.current;
      const rawProduct = bundle?.search.state.products.find(
        (product, index) => resolveProductId(product, index) === productId,
      );

      if (!bundle || !rawProduct) {
        return;
      }

      bundle.search
        .interactiveProduct({ options: { product: rawProduct } })
        .select();
    },
    updateQuery: (query: string) =>
      bundleRef.current?.searchBox.updateText(query),
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
    didYouMean: search.didYouMean(),
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

async function resolveCommerceAuth(
  authConfig: HeadlessCommerceAuthConfig,
  options: { signal?: AbortSignal } = {},
): Promise<{
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

  const config = await fetchSearchTokenConfig({ signal: options.signal });

  return {
    organizationId: config.organizationId,
    renewAccessToken: async () => {
      const renewedConfig = await fetchSearchTokenConfig();
      return renewedConfig.token;
    },
    token: config.token,
  };
}

function readCommerceSnapshot(
  bundle: CommerceControllerBundle,
): CommerceAdapterSnapshot {
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

  if (
    bundle.search.state.isLoading &&
    !bundle.summary.state.firstRequestExecuted
  ) {
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

function buildSearchResponse(
  bundle: CommerceControllerBundle,
): ProductSearchResponse {
  const products = bundle.search.state.products.map(mapHeadlessProduct);
  const pagination = mapHeadlessPagination(bundle.pagination.state);
  const didYouMeanState = bundle.didYouMean.state;
  const { appliedSort, availableSorts } = mapHeadlessSort(bundle.sort.state);

  return {
    appliedSort,
    availableSorts,
    ...(didYouMeanState.wasAutomaticallyCorrected
      ? {
          didYouMean: {
            correctedTo: didYouMeanState.wasCorrectedTo,
            originalQuery: didYouMeanState.originalQuery,
            wasAutomaticallyCorrected: true,
          },
        }
      : {}),
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
  const facet = facets.find(
    (item) => item.state.field === field && item.state.type === type,
  );

  if (!facet) {
    return;
  }

  if (type === "regular") {
    const regularValue = (facet as RegularFacet).state.values.find(
      (item) => item.value === value,
    );

    if (regularValue) {
      (facet as RegularFacet).toggleSelect(regularValue);
    }
    return;
  }

  const categoryValue = (facet as CategoryFacet).state.values.find(
    (item) => item.value === value,
  );

  if (categoryValue) {
    (facet as CategoryFacet).toggleSelect(categoryValue);
  }
}

function toggleRangeValue(
  facets: FacetGenerator["facets"],
  field: string,
  start: number,
  end: number,
) {
  const facet = facets.find(
    (item) =>
      item.state.field === field && item.state.type === "numericalRange",
  );

  // Dynamic facets (price slider, star rating) apply an arbitrary continuous range rather than
  // toggling one of Coveo's server-generated buckets, so this always replaces the current range.
  (facet as NumericFacet | undefined)?.setRanges([
    { end, endInclusive: true, start, state: "selected" },
  ]);
}

function waitForSuggestions(
  searchBox: SearchBox,
  signal?: AbortSignal,
): Promise<SearchSuggestion[]> {
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
