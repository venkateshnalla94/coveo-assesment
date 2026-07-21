import { RotateCcw, X } from "lucide-react";

const suggestedSearches = ["digital transformation", "AI search", "customer experience"];

export function ZeroResults({
  activeFilterCount,
  onClearFilters,
  onRetryQuery,
  query,
}: {
  activeFilterCount: number;
  onClearFilters: () => void;
  onRetryQuery: (query: string) => void;
  query: string;
}) {
  return (
    <div className="empty-state">
      <div>
        <h2>No results for {query || "this search"}</h2>
        <p>Try a broader query or remove filters.</p>
        <div className="zero-results-actions">
          {activeFilterCount > 0 ? (
            <button className="secondary-button" onClick={onClearFilters} type="button">
              <X aria-hidden="true" size={16} />
              Clear filters
            </button>
          ) : null}
          <button
            className="secondary-button"
            onClick={() => onRetryQuery("digital transformation")}
            type="button"
          >
            <RotateCcw aria-hidden="true" size={16} />
            Retry broader search
          </button>
        </div>
        <div className="suggested-searches" aria-label="Suggested searches">
          {suggestedSearches.map((suggestedSearch) => (
            <button key={suggestedSearch} onClick={() => onRetryQuery(suggestedSearch)} type="button">
              {suggestedSearch}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
