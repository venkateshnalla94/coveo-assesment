import { AlertCircle } from "lucide-react";

import { ResultList } from "@/components/search/results/ResultList";
import { SearchStatus } from "@/components/search/results/SearchStatus";
import { ZeroResults } from "@/components/search/results/ZeroResults";
import type { SearchResponse } from "@/features/search/models/search-models";
import type { PaginationState } from "@/features/search/services/pagination";

export function SearchResults({
  activeFilterCount,
  error,
  isLoading,
  onClearFilters,
  onRetryQuery,
  pagination,
  response,
  showStatus = true,
  query,
}: {
  activeFilterCount: number;
  error?: string;
  isLoading: boolean;
  onClearFilters: () => void;
  onRetryQuery: (query: string) => void;
  pagination: PaginationState;
  response?: SearchResponse;
  showStatus?: boolean;
  query: string;
}) {
  if (error) {
    return (
      <div className="inline-error" role="alert">
        <AlertCircle aria-hidden="true" size={18} />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <>
      {showStatus ? (
        <SearchStatus
          durationMs={response?.durationMs}
          isLoading={isLoading}
          pagination={pagination}
          query={query}
        />
      ) : null}

      {isLoading && !response ? (
        <div className="result-stack" role="status">
          {Array.from({ length: 5 }, (_, index) => (
            <div className="result-skeleton" key={index} />
          ))}
        </div>
      ) : null}

      {response && response.results.length > 0 ? <ResultList results={response.results} /> : null}

      {response && response.results.length === 0 ? (
        <ZeroResults
          activeFilterCount={activeFilterCount}
          onClearFilters={onClearFilters}
          onRetryQuery={onRetryQuery}
          query={query}
        />
      ) : null}
    </>
  );
}
