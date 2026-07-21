import { List } from "lucide-react";

import { SEARCH_SORT_OPTIONS } from "@/features/search/services/sort-options";

export function SortControl({
  onChange,
  value,
}: {
  onChange: (sort: string) => void;
  value: string;
}) {
  return (
    <div className="sort-control">
      <label htmlFor="search-sort">Sort by</label>
      <select
        aria-label="Sort results"
        id="search-sort"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {SEARCH_SORT_OPTIONS.map((option) => (
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
