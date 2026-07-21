"use client";

import { useEffect, useRef, useState } from "react";

import type { SearchSuggestion } from "@/features/search/models/search-models";
import type { SearchProvider } from "@/features/search/providers/search-provider";

export function useSearchSuggestions({
  enabled,
  provider,
  query,
}: {
  enabled: boolean;
  provider: Pick<SearchProvider, "getSuggestions">;
  query: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const requestId = useRef(0);
  const canSuggest = enabled && query.trim().length > 0;

  useEffect(() => {
    const trimmedQuery = query.trim();
    requestId.current += 1;
    const currentRequestId = requestId.current;

    if (!canSuggest) {
      return;
    }

    const timer = window.setTimeout(() => {
      setIsLoading(true);
      provider
        .getSuggestions(trimmedQuery)
        .then((nextSuggestions) => {
          if (requestId.current === currentRequestId) {
            setSuggestions(nextSuggestions);
          }
        })
        .catch(() => {
          if (requestId.current === currentRequestId) {
            setSuggestions([]);
          }
        })
        .finally(() => {
          if (requestId.current === currentRequestId) {
            setIsLoading(false);
          }
        });
    }, 180);

    return () => {
      window.clearTimeout(timer);
    };
  }, [canSuggest, provider, query]);

  return {
    isLoading: canSuggest ? isLoading : false,
    suggestions: canSuggest ? suggestions : [],
  };
}
