import { DomainResultCard } from "@/components/search/results/DomainResultCard";
import type { SearchResult } from "@/features/search/models/search-models";

export function ResultList({
  onResultSelect,
  query = "",
  results,
}: {
  onResultSelect?: (result: SearchResult, position: number, query: string) => void;
  query?: string;
  results: SearchResult[];
}) {
  return (
    <div className="result-stack" role="list">
      {results.map((result, index) => (
        <div key={result.id} role="listitem">
          <DomainResultCard
            onSelect={onResultSelect}
            position={index + 1}
            query={query}
            result={result}
          />
        </div>
      ))}
    </div>
  );
}
