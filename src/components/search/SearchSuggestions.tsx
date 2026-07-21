import type { SearchSuggestion } from "@/features/search/models/search-models";

export function SearchSuggestions({
  activeIndex,
  id,
  isLoading,
  onSelect,
  suggestions,
}: {
  activeIndex: number;
  id: string;
  isLoading: boolean;
  onSelect: (suggestion: SearchSuggestion) => void;
  suggestions: SearchSuggestion[];
}) {
  if (isLoading) {
    return (
      <div className="suggestions" id={id} role="listbox">
        <div aria-selected="false" className="suggestion-status" role="option">
          Loading suggestions
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="suggestions" id={id} role="listbox">
      {suggestions.map((suggestion, index) => (
        <button
          aria-selected={activeIndex === index}
          id={`${id}-${index}`}
          key={suggestion.id}
          onClick={() => onSelect(suggestion)}
          onMouseDown={(event) => event.preventDefault()}
          role="option"
          type="button"
        >
          {suggestion.label}
        </button>
      ))}
    </div>
  );
}
