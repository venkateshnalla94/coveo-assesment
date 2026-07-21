"use client";

import type { Result, ResultList, SearchEngine } from "@coveo/headless";

import { ResultItem } from "@/components/search/results/ResultItem";
import { useControllerState } from "@/lib/coveo/use-controller-state";

export function ResultListView({
  engine,
  controller,
  onResultSelect,
  query,
}: {
  engine: SearchEngine;
  controller: ResultList;
  onResultSelect?: (result: Result, position: number, query: string) => void;
  query?: string;
}) {
  const state = useControllerState(controller);

  if (state.isLoading && state.results.length === 0) {
    return (
      <div className="result-stack">
        {Array.from({ length: 5 }, (_, index) => (
          <div className="result-skeleton" key={index} />
        ))}
      </div>
    );
  }

  if (state.firstSearchExecuted && !state.hasResults) {
    return (
      <div className="empty-state">
        <h2>No results</h2>
        <p>Try a broader query or remove filters.</p>
      </div>
    );
  }

  return (
    <div className="result-stack">
      {state.results.map((result: Result, index) => (
        <ResultItem
          engine={engine}
          key={result.uniqueId}
          onSelect={onResultSelect}
          position={index + 1}
          query={query}
          result={result}
        />
      ))}
    </div>
  );
}
