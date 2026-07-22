"use client";

import { AlertCircle } from "lucide-react";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";

import { ComparisonBar } from "@/components/commerce/ComparisonBar";
import { ComparisonDrawer } from "@/components/commerce/ComparisonDrawer";
import {
  ProductFacetPanel,
  toggleProductFacetSelection,
  toggleProductRangeSelection,
} from "@/components/commerce/ProductFacetPanel";
import { ProductDetailsDrawer } from "@/components/commerce/ProductDetailsDrawer";
import { ProductGrid } from "@/components/commerce/ProductGrid";
import { ProductRightRail } from "@/components/commerce/ProductRightRail";
import { ProductStatus } from "@/components/commerce/ProductStatus";
import { SearchBox } from "@/components/search/SearchBox";
import { Pagination } from "@/components/search/Pagination";
import {
  AnalyticsProviderRoot,
  ConsoleAnalyticsProvider,
  CoveoAnalyticsProvider,
  useAnalytics,
} from "@/features/analytics/analytics";
import { COMMERCE_DEFAULTS } from "@/features/commerce/config/commerce-config";
import type { HeadlessCommerceAuthConfig } from "@/features/commerce/headless/commerce-auth";
import { useHeadlessCommerce } from "@/features/commerce/headless/use-headless-commerce";
import type {
  CommerceProductProvider,
  ProductResult,
  ProductSearchRequest,
  ProductSearchResponse,
} from "@/features/commerce/models/commerce-models";
import { CoveoCommerceProductProvider } from "@/features/commerce/providers/coveo-commerce-product-provider";
import { MockCommerceProductProvider } from "@/features/commerce/providers/mock-commerce-product-provider";
import type { SearchFeatureFlags } from "@/lib/features/search-feature-flags";

type ProductState =
  | { status: "loading"; response?: ProductSearchResponse }
  | { status: "success"; response: ProductSearchResponse }
  | { status: "empty"; response: ProductSearchResponse }
  | { status: "error"; message: string; response?: ProductSearchResponse };

type ProductAction =
  | { type: "requested" }
  | { type: "succeeded"; response: ProductSearchResponse }
  | { type: "failed"; message: string };

function productReducer(state: ProductState, action: ProductAction): ProductState {
  if (action.type === "requested") {
    return { status: "loading", response: "response" in state ? state.response : undefined };
  }

  if (action.type === "succeeded") {
    return {
      response: action.response,
      status: action.response.products.length === 0 ? "empty" : "success",
    };
  }

  return {
    message: action.message,
    response: "response" in state ? state.response : undefined,
    status: "error",
  };
}

export function ProductDiscoveryExperience({
  commerceAuthConfig,
  featureFlags,
}: {
  commerceAuthConfig: HeadlessCommerceAuthConfig;
  featureFlags: SearchFeatureFlags;
}) {
  const sampleMode = featureFlags.enableSampleSearchResponse;
  const analyticsProvider = useMemo(
    () => (sampleMode ? new ConsoleAnalyticsProvider() : new CoveoAnalyticsProvider()),
    [sampleMode],
  );

  return (
    <AnalyticsProviderRoot enabled={featureFlags.enableAnalytics} provider={analyticsProvider}>
      {sampleMode ? (
        <DirectProductDiscoveryContent sampleMode />
      ) : (
        <HeadlessProductDiscoveryContent authConfig={commerceAuthConfig} />
      )}
    </AnalyticsProviderRoot>
  );
}

function HeadlessProductDiscoveryContent({
  authConfig,
}: {
  authConfig: HeadlessCommerceAuthConfig;
}) {
  const analytics = useAnalytics();
  const commerce = useHeadlessCommerce({ authConfig, enabled: true });
  const [comparedProducts, setComparedProducts] = useState<ProductResult[]>([]);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [detailsProduct, setDetailsProduct] = useState<ProductResult | null>(null);
  const response = commerce.response;
  const pagination = response?.pagination;

  if (commerce.status === "error" && !response) {
    return <DirectProductDiscoveryContent sampleMode={false} />;
  }

  function submitSearch(query: string) {
    analytics.track("commerce_search_submitted", { mode: "headless", query });
    commerce.submitSearch(query);
  }

  function toggleCompare(product: ProductResult) {
    setComparedProducts((current) => {
      if (current.some((item) => item.id === product.id)) {
        analytics.track("product_compare_removed", { productId: product.id });
        return current.filter((item) => item.id !== product.id);
      }

      if (current.length >= 3) {
        return current;
      }

      analytics.track("product_compare_added", { productId: product.id });
      return [...current, product];
    });
  }

  function removeComparedProduct(productId: string) {
    analytics.track("product_compare_removed", { productId });
    setComparedProducts((current) => current.filter((product) => product.id !== productId));
  }

  function openDetails(product: ProductResult) {
    analytics.track("product_details_opened", { productId: product.id });
    setDetailsProduct(product);
  }

  return (
    <>
      <div className="search-command-bar product-search-command">
        <SearchBox
          isLoading={commerce.status === "loading"}
          onClear={commerce.clearQuery}
          onQueryChange={commerce.updateQuery}
          onSubmit={submitSearch}
          provider={commerce.suggestionsProvider}
          query={commerce.query}
        />
      </div>

      <main className="app-shell product-app-shell">
        <div className="search-context-row">
          <span>Live mode: Headless Commerce products, query suggestions, RGA guidance, and Search API resources</span>
        </div>

        <div className="search-layout product-discovery-layout">
          <ProductFacetPanel
            facets={response?.facets ?? []}
            onClearAll={() => {
              analytics.track("filters_cleared", { mode: "commerce", query: commerce.query });
              commerce.clearAllFacets();
            }}
            onClearFacet={(field) => {
              analytics.track("commerce_facet_removed", { field, query: commerce.query });
              commerce.clearFacet(field);
            }}
            onToggleFacetValue={(field, value, type) => {
              analytics.track("commerce_facet_selected", { field, query: commerce.query, value });
              commerce.toggleFacetValue(field, value, type);
            }}
            onToggleRange={(field, start, end) => {
              analytics.track("commerce_facet_selected", { end, field, query: commerce.query, start });
              commerce.toggleRange(field, start, end);
            }}
          />

          <section className="results-column product-results-column" aria-busy={commerce.status === "loading"} tabIndex={-1}>
            <div className="results-toolbar">
              <ProductStatus isLoading={commerce.status === "loading"} pagination={pagination} query={commerce.query} />
              <div className="sort-control">
                <span>Sort by</span>
                <span className="sort-readonly">Relevance</span>
              </div>
            </div>

            {commerce.status === "error" ? (
              <div className="inline-error" role="alert">
                <AlertCircle aria-hidden="true" size={18} />
                <span>{commerce.message}</span>
              </div>
            ) : null}

            {commerce.status === "loading" && !response ? (
              <div className="product-grid" role="status" aria-live="polite" aria-label="Loading products">
                {Array.from({ length: 6 }, (_, index) => (
                  <div className="product-skeleton" key={index} />
                ))}
              </div>
            ) : null}

            {response && response.products.length > 0 ? (
              <ProductGrid
                comparedProducts={comparedProducts}
                onCompare={toggleCompare}
                onOpenDetails={openDetails}
                products={response.products}
              />
            ) : null}

            {response && response.products.length === 0 ? (
              <div className="empty-state">
                <h2>No products found for {commerce.query}</h2>
                <p>Try a broader query or clear filters.</p>
                <button className="secondary-button" onClick={commerce.clearAllFacets} type="button">
                  Clear filters
                </button>
              </div>
            ) : null}

            {pagination && pagination.totalPages > 1 ? (
              <Pagination
                onSelectPage={(page) => {
                  analytics.track("commerce_page_changed", { page, query: commerce.query });
                  commerce.selectPage(page - 1);
                }}
                pagination={{
                  currentPage: pagination.page + 1,
                  firstResult: pagination.page * pagination.perPage + 1,
                  lastResult: Math.min((pagination.page + 1) * pagination.perPage, pagination.totalProducts),
                  pageSize: pagination.perPage,
                  totalCount: pagination.totalProducts,
                  totalPages: pagination.totalPages,
                }}
              />
            ) : null}
          </section>

          <ProductRightRail query={commerce.query || "welding arm"} sampleMode={false} />
        </div>
      </main>

      <ComparisonBar
        onClear={() => setComparedProducts([])}
        onOpen={() => {
          analytics.track("product_compare_opened", { count: comparedProducts.length });
          setComparisonOpen(true);
        }}
        onRemove={removeComparedProduct}
        products={comparedProducts}
      />

      {comparisonOpen ? (
        <ComparisonDrawer onClose={() => setComparisonOpen(false)} products={comparedProducts} />
      ) : null}

      {detailsProduct ? (
        <ProductDetailsDrawer
          onClose={() => setDetailsProduct(null)}
          onContactSales={(product) => analytics.track("contact_sales_clicked", { productId: product.id })}
          onRequestQuote={(product) => analytics.track("request_quote_clicked", { productId: product.id })}
          product={detailsProduct}
        />
      ) : null}
    </>
  );
}

function DirectProductDiscoveryContent({ sampleMode }: { sampleMode: boolean }) {
  const analytics = useAnalytics();
  const provider = useMemo<CommerceProductProvider>(
    () => (sampleMode ? new MockCommerceProductProvider() : new CoveoCommerceProductProvider()),
    [sampleMode],
  );
  const [draftQuery, setDraftQuery] = useState("welding arm");
  const [request, setRequest] = useState<ProductSearchRequest>({
    facets: [],
    page: 0,
    perPage: COMMERCE_DEFAULTS.perPage,
    query: "welding arm",
  });
  const [state, dispatch] = useReducer(productReducer, { status: "loading" });
  const [comparedProducts, setComparedProducts] = useState<ProductResult[]>([]);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [detailsProduct, setDetailsProduct] = useState<ProductResult | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const abortController = new AbortController();
    requestId.current += 1;
    const currentRequest = requestId.current;
    dispatch({ type: "requested" });

    provider
      .search(request, { signal: abortController.signal })
      .then((response) => {
        if (requestId.current === currentRequest && !abortController.signal.aborted) {
          dispatch({ response, type: "succeeded" });
        }
      })
      .catch(() => {
        if (requestId.current === currentRequest && !abortController.signal.aborted) {
          dispatch({ message: "Product search could not be loaded.", type: "failed" });
        }
      });

    return () => abortController.abort();
  }, [provider, request]);

  const response = "response" in state ? state.response : undefined;
  const pagination = response?.pagination;

  function runSearch(nextRequest: ProductSearchRequest) {
    setRequest({ ...nextRequest, page: Math.max(0, nextRequest.page) });
  }

  function submitSearch(query: string) {
    analytics.track("commerce_search_submitted", { mode: sampleMode ? "sample" : "live", query });
    runSearch({ ...request, page: 0, query });
  }

  function toggleCompare(product: ProductResult) {
    setComparedProducts((current) => {
      if (current.some((item) => item.id === product.id)) {
        analytics.track("product_compare_removed", { productId: product.id });
        return current.filter((item) => item.id !== product.id);
      }

      if (current.length >= 3) {
        return current;
      }

      analytics.track("product_compare_added", { productId: product.id });
      return [...current, product];
    });
  }

  function removeComparedProduct(productId: string) {
    analytics.track("product_compare_removed", { productId });
    setComparedProducts((current) => current.filter((product) => product.id !== productId));
  }

  function openDetails(product: ProductResult) {
    analytics.track("product_details_opened", { productId: product.id });
    setDetailsProduct(product);
  }

  return (
    <>
      <div className="search-command-bar product-search-command">
        <SearchBox
          isLoading={state.status === "loading"}
          onClear={() => setDraftQuery("")}
          onQueryChange={setDraftQuery}
          onSubmit={submitSearch}
          provider={{ getSuggestions: provider.getSuggestions?.bind(provider) ?? (() => Promise.resolve([])) }}
          query={draftQuery}
        />
      </div>

      <main className="app-shell product-app-shell">
        <div className="search-context-row">
          <span>
            {sampleMode
              ? "Sample mode: fixture products, suggestions, guidance, and resources"
              : "Live mode: Commerce products, query suggestions, RGA guidance, and Search API resources"}
          </span>
        </div>

        <div className="search-layout product-discovery-layout">
          <ProductFacetPanel
            facets={response?.facets ?? []}
            onClearAll={() => {
              analytics.track("filters_cleared", { mode: "commerce", query: request.query });
              runSearch({ ...request, facets: [], page: 0 });
            }}
            onClearFacet={(field) => {
              analytics.track("commerce_facet_removed", { field, query: request.query });
              runSearch({
                ...request,
                facets: request.facets.filter((facet) => facet.field !== field),
                page: 0,
              });
            }}
            onToggleFacetValue={(field, value, type) => {
              analytics.track("commerce_facet_selected", { field, query: request.query, value });
              runSearch({
                ...request,
                facets: toggleProductFacetSelection(request.facets, field, value, type),
                page: 0,
              });
            }}
            onToggleRange={(field, start, end) => {
              analytics.track("commerce_facet_selected", { end, field, query: request.query, start });
              runSearch({
                ...request,
                facets: toggleProductRangeSelection(request.facets, field, start, end),
                page: 0,
              });
            }}
          />

          <section className="results-column product-results-column" aria-busy={state.status === "loading"} tabIndex={-1}>
            <div className="results-toolbar">
              <ProductStatus isLoading={state.status === "loading"} pagination={pagination} query={request.query} />
              <div className="sort-control">
                <span>Sort by</span>
                <span className="sort-readonly">Relevance</span>
              </div>
            </div>

            {state.status === "error" ? (
              <div className="inline-error" role="alert">
                <AlertCircle aria-hidden="true" size={18} />
                <span>{state.message}</span>
              </div>
            ) : null}

            {state.status === "loading" && !response ? (
              <div className="product-grid" role="status" aria-live="polite" aria-label="Loading products">
                {Array.from({ length: 6 }, (_, index) => (
                  <div className="product-skeleton" key={index} />
                ))}
              </div>
            ) : null}

            {response && response.products.length > 0 ? (
              <ProductGrid
                comparedProducts={comparedProducts}
                onCompare={toggleCompare}
                onOpenDetails={openDetails}
                products={response.products}
              />
            ) : null}

            {response && response.products.length === 0 ? (
              <div className="empty-state">
                <h2>No products found for {request.query}</h2>
                <p>Try a broader query or clear filters.</p>
                <button className="secondary-button" onClick={() => runSearch({ ...request, facets: [], page: 0 })} type="button">
                  Clear filters
                </button>
              </div>
            ) : null}

            {pagination && pagination.totalPages > 1 ? (
              <Pagination
                onSelectPage={(page) => {
                  analytics.track("commerce_page_changed", { page, query: request.query });
                  runSearch({ ...request, page: page - 1 });
                }}
                pagination={{
                  currentPage: pagination.page + 1,
                  firstResult: pagination.page * pagination.perPage + 1,
                  lastResult: Math.min((pagination.page + 1) * pagination.perPage, pagination.totalProducts),
                  pageSize: pagination.perPage,
                  totalCount: pagination.totalProducts,
                  totalPages: pagination.totalPages,
                }}
              />
            ) : null}
          </section>

          <ProductRightRail query={request.query} sampleMode={sampleMode} />
        </div>
      </main>

      <ComparisonBar
        onClear={() => setComparedProducts([])}
        onOpen={() => {
          analytics.track("product_compare_opened", { count: comparedProducts.length });
          setComparisonOpen(true);
        }}
        onRemove={removeComparedProduct}
        products={comparedProducts}
      />

      {comparisonOpen ? (
        <ComparisonDrawer onClose={() => setComparisonOpen(false)} products={comparedProducts} />
      ) : null}

      {detailsProduct ? (
        <ProductDetailsDrawer
          onClose={() => setDetailsProduct(null)}
          onContactSales={(product) => analytics.track("contact_sales_clicked", { productId: product.id })}
          onRequestQuote={(product) => analytics.track("request_quote_clicked", { productId: product.id })}
          product={detailsProduct}
        />
      ) : null}
    </>
  );
}
