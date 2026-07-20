"use client";

import type { SearchBox } from "@coveo/headless";
import { Search, X } from "lucide-react";
import { FormEvent, useState } from "react";

import { useControllerState } from "@/lib/coveo/use-controller-state";

export function SearchBoxView({ controller }: { controller: SearchBox }) {
  const state = useControllerState(controller);
  const [isFocused, setIsFocused] = useState(false);
  const suggestionsVisible = isFocused && state.suggestions.length > 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    controller.submit();
  }

  return (
    <div className="search-box-wrap">
      <form className="search-box" onSubmit={handleSubmit} role="search">
        <Search aria-hidden="true" size={20} />
        <input
          aria-label="Search"
          autoComplete="off"
          onBlur={() => window.setTimeout(() => setIsFocused(false), 120)}
          onChange={(event) => controller.updateText(event.target.value)}
          onFocus={() => {
            setIsFocused(true);
            controller.showSuggestions();
          }}
          placeholder="Search indexed content"
          type="search"
          value={state.value}
        />
        {state.value ? (
          <button
            aria-label="Clear search"
            className="icon-button"
            onClick={() => controller.clear()}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        ) : null}
        <button className="primary-button" disabled={state.isLoading} type="submit">
          Search
        </button>
      </form>

      {suggestionsVisible ? (
        <div className="suggestions" role="listbox">
          {state.suggestions.map((suggestion) => (
            <button
              key={suggestion.rawValue}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => controller.selectSuggestion(suggestion.rawValue)}
              aria-selected="false"
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
