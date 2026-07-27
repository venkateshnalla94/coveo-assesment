"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { ComparisonBar } from "@/components/commerce/ComparisonBar";
import { ComparisonDrawer } from "@/components/commerce/ComparisonDrawer";
import { ProductFacetPanel } from "@/components/commerce/ProductFacetPanel";
import { ProductDetailsDrawer } from "@/components/commerce/ProductDetailsDrawer";
import { ProductResultsColumn } from "@/components/commerce/ProductResultsColumn";
import { ProductRightRail } from "@/components/commerce/ProductRightRail";
import { useProductComparison } from "@/components/commerce/use-product-comparison";
import { usePublishHeaderSearch } from "@/components/layout/header-search-context";
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
  const {
    comparedProducts,
    comparisonOpen,
    toggleCompare,
    removeComparedProduct,
    openComparison,
    closeComparison,
    clearComparison,
  } = useProductComparison(analytics);
  const [detailsProduct, setDetailsProduct] = useState<ProductResult | null>(null);
  // Tracks the last *submitted* query. Drives the Header nav links (`?q=` on Products/Blog) and
  // gates the RGA / Trending Content fetches so they run once per search submission instead of
  // once per keystroke — those are isolated, non-product-search Coveo calls and must not re-fire
  // while the user is still typing in the product search box.
  const [committedQuery, setCommittedQuery] = useState(initialQuery);
  const response = commerce.response;
  const pagination = response?.pagination;
  const rightRailQuery = committedQuery || "welding arm";
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

  function openDetails(product: ProductResult) {
    analytics.track("product_details_opened", { productId: product.id });
    commerce.trackProductClick(product.id);
    setDetailsProduct(product);
  }

  usePublishHeaderSearch({
    isLoading: commerce.status === "loading",
    onClear: commerce.clearQuery,
    onQueryChange: commerce.updateQuery,
    onSubmit: submitSearch,
    provider: commerce.suggestionsProvider,
    query: commerce.query,
  });

  return (
    <>
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

          <ProductResultsColumn
            appliedSort={response?.appliedSort ?? ""}
            availableSorts={response?.availableSorts ?? []}
            comparedProducts={comparedProducts}
            committedQuery={committedQuery}
            didYouMean={response?.didYouMean}
            errorMessage={commerce.status === "error" ? commerce.message : undefined}
            featureFlags={featureFlags}
            feedbackProvider={feedbackProvider}
            generativeProvider={generativeProvider}
            isLoading={commerce.status === "loading"}
            onClearAllFacets={commerce.clearAllFacets}
            onCompare={toggleCompare}
            onOpenDetails={openDetails}
            onProductClick={(product) => commerce.trackProductClick(product.id)}
            onRetry={() => {
              analytics.track("commerce_search_submitted", { mode: "retry", query: commerce.query });
              commerce.retry();
            }}
            onSelectPage={(page) => {
              analytics.track("commerce_page_changed", { page, query: commerce.query });
              commerce.selectPage(page - 1);
            }}
            onSortChange={(sortId) => {
              analytics.track("commerce_sort_changed", { query: commerce.query, sort: sortId });
              commerce.updateSort(sortId);
            }}
            pagination={pagination}
            products={response?.products}
            query={commerce.query}
            status={commerce.status}
          />

          <ProductRightRail featureFlags={featureFlags} query={rightRailQuery} />
        </div>
      </main>

      <ComparisonBar
        onClear={clearComparison}
        onOpen={openComparison}
        onRemove={removeComparedProduct}
        products={comparedProducts}
      />

      {comparisonOpen ? (
        <ComparisonDrawer onClose={closeComparison} products={comparedProducts} />
      ) : null}

      {detailsProduct ? (
        <ProductDetailsDrawer
          onClose={() => setDetailsProduct(null)}
          onContactSales={(product) => analytics.track("contact_sales_clicked", { productId: product.id })}
          onProductClick={(product) => commerce.trackProductClick(product.id)}
          onRequestQuote={(product) => analytics.track("request_quote_clicked", { productId: product.id })}
          product={detailsProduct}
        />
      ) : null}
    </>
  );
}
