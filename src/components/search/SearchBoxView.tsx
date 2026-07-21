"use client";

import type { SearchBox } from "@coveo/headless";
import { Search, X } from "lucide-react";
import { FormEvent, KeyboardEvent, useId, useState } from "react";

import { SEARCH_UI } from "@/components/search/search-ui.constants";
import { useControllerState } from "@/lib/coveo/use-controller-state";

export function SearchBoxView({
  controller,
  onSearchSubmitted,
  onSuggestionSelected,
}: {
  controller: SearchBox;
  onSearchSubmitted?: (query: string) => void;
  onSuggestionSelected?: (suggestion: string) => void;
}) {
  const state = useControllerState(controller);
  const suggestionsId = useId();
  const [activeIndex, setActiveIndex] = useState(-1);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const suggestionsVisible = suggestionsOpen && state.suggestions.length > 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!state.value.trim()) {
      return;
    }
    setSuggestionsOpen(false);
    setActiveIndex(-1);
    onSearchSubmitted?.(state.value.trim());
    controller.submit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setSuggestionsOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (!suggestionsVisible) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((currentIndex) => (currentIndex + 1) % state.suggestions.length);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((currentIndex) =>
        currentIndex <= 0 ? state.suggestions.length - 1 : currentIndex - 1,
      );
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      setSuggestionsOpen(false);
      onSuggestionSelected?.(state.suggestions[activeIndex].rawValue);
      controller.selectSuggestion(state.suggestions[activeIndex].rawValue);
    }
  }

  return (
    <div className="search-box-wrap">
      <form className="search-box" onSubmit={handleSubmit} role="search">
        <Search aria-hidden="true" size={20} />
        <input
          aria-activedescendant={activeIndex >= 0 ? `${suggestionsId}-${activeIndex}` : undefined}
          aria-autocomplete="list"
          aria-controls={suggestionsVisible ? suggestionsId : undefined}
          aria-expanded={suggestionsVisible}
          aria-label="Search"
          autoComplete="off"
          onBlur={() =>
            window.setTimeout(() => {
              setSuggestionsOpen(false);
            }, 120)
          }
          onChange={(event) => {
            controller.updateText(event.target.value);
            setActiveIndex(-1);
            setSuggestionsOpen(true);
          }}
          onFocus={() => {
            setSuggestionsOpen(true);
            controller.showSuggestions();
          }}
          onKeyDown={handleKeyDown}
          placeholder={SEARCH_UI.defaultQuery}
          role="combobox"
          type="search"
          value={state.value}
        />
        {state.value ? (
          <button
            aria-label="Clear search"
            className="icon-button"
            onClick={() => {
              setSuggestionsOpen(false);
              setActiveIndex(-1);
              controller.clear();
            }}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        ) : null}
        <button
          aria-label="Search"
          className="primary-button"
          disabled={state.isLoading || state.value.trim().length === 0}
          type="submit"
        >
          <Search aria-hidden="true" size={22} />
        </button>
      </form>

      {suggestionsVisible ? (
        <div className="suggestions" id={suggestionsId} role="listbox">
          {state.suggestions.map((suggestion, index) => (
            <button
              key={suggestion.rawValue}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setSuggestionsOpen(false);
                setActiveIndex(-1);
                onSuggestionSelected?.(suggestion.rawValue);
                controller.selectSuggestion(suggestion.rawValue);
              }}
              aria-selected={activeIndex === index}
              id={`${suggestionsId}-${index}`}
              role="option"
              type="button"
            >
              {suggestion.rawValue}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
