import { DomainResultCard } from "@/components/search/results/DomainResultCard";
import type { SearchResult } from "@/features/search/models/search-models";

export function ResultList({ results }: { results: SearchResult[] }) {
  return (
    <div className="result-stack" role="list">
      {results.map((result) => (
        <div key={result.id} role="listitem">
          <DomainResultCard result={result} />
        </div>
      ))}
    </div>
  );
}
