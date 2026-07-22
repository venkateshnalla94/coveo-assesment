"use client";

import { Search, X } from "lucide-react";
import { FormEvent, KeyboardEvent, useEffect, useId, useRef, useState } from "react";

import { SearchSuggestions } from "@/components/search/SearchSuggestions";
import { SEARCH_UI } from "@/components/search/search-ui.constants";
import {
  type SuggestionsProvider,
  useSearchSuggestions,
} from "@/components/search/use-search-suggestions";
import type { SearchSuggestion } from "@/features/search/models/search-models";

export function SearchBox({
  autoFocus = true,
  isLoading,
  onClear,
  onQueryChange,
  onSuggestionSelected,
  onSubmit,
  provider,
  query,
}: {
  autoFocus?: boolean;
  isLoading: boolean;
  onClear: () => void;
  onQueryChange: (query: string) => void;
  onSuggestionSelected?: (suggestion: SearchSuggestion) => void;
  onSubmit: (query: string) => void;
  provider: SuggestionsProvider;
  query: string;
}) {
  const suggestionsId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const { isLoading: isLoadingSuggestions, suggestions } = useSearchSuggestions({
    enabled: isFocused && suggestionsOpen,
    provider,
    query,
  });
  const showSuggestions = suggestionsOpen && (isLoadingSuggestions || suggestions.length > 0);

  useEffect(() => {
    wrapperRef.current?.setAttribute("data-search-ready", "true");
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  function submitQuery(nextQuery = query) {
    const trimmedQuery = nextQuery.trim();

    if (!trimmedQuery) {
      return;
    }

    setSuggestionsOpen(false);
    setActiveIndex(-1);
    onSubmit(trimmedQuery);
  }

  function selectSuggestion(suggestion: SearchSuggestion) {
    onQueryChange(suggestion.value);
    setSuggestionsOpen(false);
    setActiveIndex(-1);
    onSuggestionSelected?.(suggestion);
    onSubmit(suggestion.value);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitQuery();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setSuggestionsOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (!showSuggestions || suggestions.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((currentIndex) => (currentIndex + 1) % suggestions.length);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((currentIndex) =>
        currentIndex <= 0 ? suggestions.length - 1 : currentIndex - 1,
      );
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    }
  }

  return (
    <div className="search-box-wrap" data-search-ready="false" ref={wrapperRef}>
      <form className="search-box" onSubmit={handleSubmit} role="search">
        <Search aria-hidden="true" size={20} />
        <input
          aria-activedescendant={activeIndex >= 0 ? `${suggestionsId}-${activeIndex}` : undefined}
          aria-autocomplete="list"
          aria-controls={showSuggestions ? suggestionsId : undefined}
          aria-expanded={showSuggestions}
          aria-label="Search"
          autoComplete="off"
          autoFocus={autoFocus}
          disabled={isLoading}
          ref={inputRef}
          onBlur={() => window.setTimeout(() => setSuggestionsOpen(false), 120)}
          onChange={(event) => {
            setIsFocused(true);
            onQueryChange(event.target.value);
            setActiveIndex(-1);
            setSuggestionsOpen(true);
          }}
          onFocus={() => {
            setIsFocused(true);
            setSuggestionsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={SEARCH_UI.defaultQuery}
          role="combobox"
          type="search"
          value={query}
        />
        {query ? (
          <button
            aria-label="Clear search"
            className="icon-button"
            onClick={() => {
              setSuggestionsOpen(false);
              setActiveIndex(-1);
              onClear();
            }}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        ) : null}
        <button
          aria-label="Search"
          className="primary-button"
          disabled={isLoading || query.trim().length === 0}
          type="submit"
        >
          <Search aria-hidden="true" size={22} />
        </button>
      </form>

      <SearchSuggestions
        activeIndex={activeIndex}
        id={suggestionsId}
        isLoading={isLoadingSuggestions}
        onSelect={selectSuggestion}
        suggestions={suggestions}
      />
    </div>
  );
}
