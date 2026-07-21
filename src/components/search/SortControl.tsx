import { List } from "lucide-react";

import { SEARCH_SORT_OPTIONS, type SearchSort } from "@/features/search/services/sort-options";

export function SortControl({
  onChange,
  options = SEARCH_SORT_OPTIONS.map((option) => option.value),
  value,
}: {
  onChange: (sort: string) => void;
  options?: readonly SearchSort[];
  value: string;
}) {
  const visibleOptions = SEARCH_SORT_OPTIONS.filter((option) => options.includes(option.value));

  if (visibleOptions.length <= 1) {
    return (
      <div className="sort-control">
        <span>Sort by</span>
        <span className="sort-readonly">{visibleOptions[0]?.label ?? "Relevance"}</span>
      </div>
    );
  }

  return (
    <div className="sort-control">
      <label htmlFor="search-sort">Sort by</label>
      <select
        aria-label="Sort results"
        id="search-sort"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {visibleOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button aria-label="List view" className="header-icon-button" type="button">
        <List aria-hidden="true" size={19} />
      </button>
    </div>
  );
}
