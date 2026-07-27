import { AlertCircle } from "lucide-react";

import { GenerativeAnswer } from "@/components/generative/GenerativeAnswer";
import { Pagination } from "@/components/search/Pagination";
import { ProductGrid } from "@/components/commerce/ProductGrid";
import { ProductSortControl } from "@/components/commerce/ProductSortControl";
import { ProductStatus } from "@/components/commerce/ProductStatus";
import type { FeedbackProvider } from "@/features/generative/providers/feedback-provider";
import type { GenerativeProvider } from "@/features/generative/providers/generative-provider";
import type {
  ProductDidYouMean,
  ProductPagination,
  ProductResult,
} from "@/features/commerce/models/commerce-models";
import type { SearchFeatureFlags } from "@/lib/features/search-feature-flags";

export function ProductResultsColumn({
  appliedSort,
  availableSorts,
  comparedProducts,
  committedQuery,
  didYouMean,
  errorMessage,
  featureFlags,
  feedbackProvider,
  generativeProvider,
  isLoading,
  onClearAllFacets,
  onCompare,
  onOpenDetails,
  onProductClick,
  onRetry,
  onSelectPage,
  onSortChange,
  pagination,
  products,
  query,
  status,
}: {
  appliedSort: string;
  availableSorts: { id: string; label: string }[];
  comparedProducts: ProductResult[];
  committedQuery: string;
  didYouMean?: ProductDidYouMean;
  errorMessage: string | undefined;
  featureFlags: Pick<
    SearchFeatureFlags,
    | "enableGenerativeAnswers"
    | "enableGenerativeCitations"
    | "enableGenerativeDisclaimer"
    | "enableGenerativeFeedback"
    | "enableGenerativeStreaming"
  >;
  feedbackProvider: FeedbackProvider;
  generativeProvider: GenerativeProvider;
  isLoading: boolean;
  onClearAllFacets: () => void;
  onCompare: (product: ProductResult) => void;
  onOpenDetails: (product: ProductResult) => void;
  onProductClick: (product: ProductResult) => void;
  onRetry: () => void;
  onSelectPage: (page: number) => void;
  onSortChange: (sortId: string) => void;
  pagination?: ProductPagination;
  products: ProductResult[] | undefined;
  query: string;
  status: "loading" | "success" | "empty" | "error";
}) {
  return (
    <section className="results-column product-results-column" aria-busy={isLoading} tabIndex={-1}>
      <GenerativeAnswer
        feedbackProvider={feedbackProvider}
        featureFlags={featureFlags}
        provider={generativeProvider}
        query={committedQuery}
      />

      <div className="results-toolbar">
        <ProductStatus
          didYouMean={didYouMean}
          isLoading={isLoading}
          pagination={pagination}
          query={query}
        />
        <ProductSortControl
          appliedSort={appliedSort}
          availableSorts={availableSorts}
          onSortChange={onSortChange}
        />
      </div>

      {status === "error" ? (
        <div className="inline-error" role="alert">
          <AlertCircle aria-hidden="true" size={18} />
          <span>{errorMessage}</span>
          <button className="secondary-button" onClick={onRetry} type="button">
            Retry
          </button>
        </div>
      ) : null}

      {status === "loading" && !products ? (
        <div className="product-grid" role="status" aria-live="polite" aria-label="Loading products">
          {Array.from({ length: 6 }, (_, index) => (
            <div className="product-skeleton" key={index} />
          ))}
        </div>
      ) : null}

      {products && products.length > 0 ? (
        <ProductGrid
          comparedProducts={comparedProducts}
          onCompare={onCompare}
          onOpenDetails={onOpenDetails}
          onProductClick={onProductClick}
          products={products}
        />
      ) : null}

      {products && products.length === 0 ? (
        <div className="empty-state">
          <h2>No products found for {query}</h2>
          <p>Try a broader query or clear filters.</p>
          <button className="secondary-button" onClick={onClearAllFacets} type="button">
            Clear filters
          </button>
        </div>
      ) : null}

      {pagination && pagination.totalPages > 1 ? (
        <Pagination
          onSelectPage={onSelectPage}
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
  );
}
