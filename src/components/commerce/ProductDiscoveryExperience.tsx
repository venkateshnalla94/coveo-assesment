"use client";

import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { ComparisonBar } from "@/components/commerce/ComparisonBar";
import { ComparisonDrawer } from "@/components/commerce/ComparisonDrawer";
import { ProductFacetPanel } from "@/components/commerce/ProductFacetPanel";
import { ProductDetailsDrawer } from "@/components/commerce/ProductDetailsDrawer";
import { ProductGrid } from "@/components/commerce/ProductGrid";
import { ProductRightRail } from "@/components/commerce/ProductRightRail";
import { ProductStatus } from "@/components/commerce/ProductStatus";
import { GenerativeAnswer } from "@/components/generative/GenerativeAnswer";
import { Header } from "@/components/layout/Header";
import { Pagination } from "@/components/search/Pagination";
import {
  AnalyticsProviderRoot,
  CoveoAnalyticsProvider,
  useAnalytics,
} from "@/features/analytics/analytics";
import type { HeadlessCommerceAuthConfig } from "@/features/commerce/headless/commerce-auth";
import { useHeadlessCommerce } from "@/features/commerce/headless/use-headless-commerce";
import type { ProductResult } from "@/features/commerce/models/commerce-models";
import { InMemoryFeedbackProvider } from "@/features/generative/providers/feedback-provider";
import { CoveoGenerativeProvider } from "@/features/generative/providers/coveo-generative-provider";
import type { SearchFeatureFlags } from "@/lib/features/search-feature-flags";

export function ProductDiscoveryExperience({
  commerceAuthConfig,
  featureFlags,
  initialQuery = "welding arm",
}: {
  commerceAuthConfig: HeadlessCommerceAuthConfig;
  featureFlags: SearchFeatureFlags;
  initialQuery?: string;
}) {
  const analyticsProvider = useMemo(
    () => new CoveoAnalyticsProvider(),
    [],
  );

  return (
    <AnalyticsProviderRoot enabled={featureFlags.enableAnalytics} provider={analyticsProvider}>
      <HeadlessProductDiscoveryContent
        authConfig={commerceAuthConfig}
        featureFlags={featureFlags}
        initialQuery={initialQuery}
      />
    </AnalyticsProviderRoot>
  );
}

function HeadlessProductDiscoveryContent({
  authConfig,
  featureFlags,
  initialQuery,
}: {
  authConfig: HeadlessCommerceAuthConfig;
  featureFlags: SearchFeatureFlags;
  initialQuery: string;
}) {
  const analytics = useAnalytics();
  const router = useRouter();
  const commerce = useHeadlessCommerce({ analytics, authConfig, enabled: true, initialQuery });
  const [comparedProducts, setComparedProducts] = useState<ProductResult[]>([]);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [detailsProduct, setDetailsProduct] = useState<ProductResult | null>(null);
  // Tracks the last *submitted* query for the Header nav links (`?q=` on Products/Blog), so
  // they stay stable while the user is mid-keystroke instead of updating on every change.
  const [committedQuery, setCommittedQuery] = useState(initialQuery);
  const response = commerce.response;
  const pagination = response?.pagination;
  const rightRailQuery = commerce.query || "welding arm";
  const generativeProvider = useMemo(() => new CoveoGenerativeProvider(), []);
  const feedbackProvider = useMemo(() => new InMemoryFeedbackProvider(), []);

  function submitSearch(query: string) {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return;
    }

    analytics.track("commerce_search_submitted", { mode: "headless", query: trimmedQuery });
    commerce.submitSearch(trimmedQuery);
    setCommittedQuery(trimmedQuery);
    router.replace(`/catalog?q=${encodeURIComponent(trimmedQuery)}`, { scroll: false });
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
    commerce.trackProductClick(product.id);
    setDetailsProduct(product);
  }

  return (
    <>
      <Header
        activePath="/catalog"
        authConfig={authConfig}
        currentQuery={committedQuery}
        search={{
          isLoading: commerce.status === "loading",
          onClear: commerce.clearQuery,
          onQueryChange: commerce.updateQuery,
          onSubmit: submitSearch,
          provider: commerce.suggestionsProvider,
          query: commerce.query,
        }}
      />

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
            <GenerativeAnswer
              feedbackProvider={feedbackProvider}
              featureFlags={featureFlags}
              provider={generativeProvider}
              query={commerce.query}
            />

            <div className="results-toolbar">
              <ProductStatus
                didYouMean={response?.didYouMean}
                isLoading={commerce.status === "loading"}
                pagination={pagination}
                query={commerce.query}
              />
              <div className="sort-control">
                <span>Sort by</span>
                <span className="sort-readonly">Relevance</span>
              </div>
            </div>

            {commerce.status === "error" ? (
              <div className="inline-error" role="alert">
                <AlertCircle aria-hidden="true" size={18} />
                <span>{commerce.message}</span>
                <button
                  className="secondary-button"
                  onClick={() => {
                    analytics.track("commerce_search_submitted", { mode: "retry", query: commerce.query });
                    commerce.retry();
                  }}
                  type="button"
                >
                  Retry
                </button>
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

          <ProductRightRail featureFlags={featureFlags} query={rightRailQuery} />
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
