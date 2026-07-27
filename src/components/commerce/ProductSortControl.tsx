interface SortOption {
  id: string;
  label: string;
}

export function ProductSortControl({
  appliedSort,
  availableSorts,
  onSortChange,
}: {
  appliedSort: string;
  availableSorts: SortOption[];
  onSortChange: (sortId: string) => void;
}) {
  if (availableSorts.length <= 1) {
    return (
      <div className="sort-control">
        <span>Sort by</span>
        <span className="sort-readonly">{availableSorts[0]?.label ?? "Relevance"}</span>
      </div>
    );
  }

  return (
    <div className="sort-control">
      <label htmlFor="commerce-sort-select">Sort by</label>
      <select
        id="commerce-sort-select"
        onChange={(event) => onSortChange(event.target.value)}
        value={appliedSort}
      >
        {availableSorts.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
