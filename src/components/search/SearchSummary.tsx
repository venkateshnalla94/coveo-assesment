"use client";

import type { QuerySummary } from "@coveo/headless";

import { useControllerState } from "@/lib/coveo/use-controller-state";

export function SearchSummary({ controller }: { controller: QuerySummary }) {
  const state = useControllerState(controller);

  if (!state.firstSearchExecuted || state.isLoading) {
    return <p className="summary-text">Loading results</p>;
  }

  if (!state.hasResults) {
    return <p className="summary-text">No results found</p>;
  }

  return (
    <p className="summary-text">
      Showing {state.firstResult}-{state.lastResult} of {state.total.toLocaleString()} results
      {state.hasDuration ? ` in ${state.durationInSeconds.toFixed(2)}s` : ""}
    </p>
  );
}
