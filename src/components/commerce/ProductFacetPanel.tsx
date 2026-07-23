import { Check, ChevronDown, Star, X } from "lucide-react";
import { useState, type CSSProperties } from "react";

import type {
  ProductFacet,
  ProductFacetSelection,
  ProductNumericalRangeFacet,
} from "@/features/commerce/models/commerce-models";

const RATING_STARS = [1, 2, 3, 4, 5];

export function ProductFacetPanel({
  facets,
  onClearAll,
  onClearFacet,
  onToggleFacetValue,
  onToggleRange,
}: {
  facets: ProductFacet[];
  onClearAll: () => void;
  onClearFacet: (field: string) => void;
  onToggleFacetValue: (field: string, value: string, type: "regular" | "hierarchical") => void;
  onToggleRange: (field: string, start: number, end: number) => void;
}) {
  const activeFilters = facets.flatMap((facet) => {
    if (facet.type === "numericalRange") {
      // Dynamic ranges (price slider, star rating) live in `selectedRange`, separate from the
      // server-generated `values` buckets, since selecting one deselects the other on Coveo's side.
      const selected = facet.selectedRange ?? facet.values.find((value) => value.selected);

      if (!selected) {
        return [];
      }

      return [
        {
          key: `${facet.field}-${selected.start}-${selected.end}`,
          label: `${facet.label}: ${formatRangeValue(facet, selected.start, selected.end)}`,
          // Numeric range facets only ever have one active value, so clearing the field is
          // equivalent to removing this one selection.
          onRemove: () => onClearFacet(facet.field),
        },
      ];
    }

    return facet.values
      .filter((value) => value.selected)
      .map((value) => ({
        key: `${facet.field}-${value.value}`,
        label: `${facet.label}: ${value.label}`,
        // Multi-select facets: removing a chip should deselect only that value, not the whole facet.
        onRemove: () => onToggleFacetValue(facet.field, value.value, facet.type),
      }));
  });

  return (
    <aside className="facet-sidebar product-facet-sidebar" aria-label="Product filters">
      <div className="facet-sidebar-header">
        <h2>Filters</h2>
        <button className="link-button" disabled={activeFilters.length === 0} onClick={onClearAll} type="button">
          Clear all
        </button>
      </div>

      {activeFilters.length > 0 ? (
        <div className="active-filters" aria-label="Active product filters">
          {activeFilters.map((filter) => (
            <button key={filter.key} onClick={filter.onRemove} type="button">
              {filter.label}
              <X aria-hidden="true" size={14} />
            </button>
          ))}
        </div>
      ) : null}

      {facets.map((facet) => (
        <section className="facet-panel" key={facet.id}>
          <div className="facet-header">
            <h2>{facet.label}</h2>
            <div className="facet-header-actions">
              {facetHasSelection(facet) ? (
                <button className="link-button" onClick={() => onClearFacet(facet.field)} type="button">
                  Clear
                </button>
              ) : null}
              <ChevronDown aria-hidden="true" size={16} />
            </div>
          </div>

          {facet.type === "numericalRange" && facet.field === "ec_rating" ? (
            <RatingFacetControl
              facet={facet}
              onClear={() => onClearFacet(facet.field)}
              onSelect={(start, end) => onToggleRange(facet.field, start, end)}
            />
          ) : facet.type === "numericalRange" && facet.field === "ec_price" && facet.domain ? (
            <PriceRangeFacetControl
              facet={facet}
              onChange={(start, end) => onToggleRange(facet.field, start, end)}
            />
          ) : facet.type === "numericalRange" ? (
            <div className="facet-values">
              {facet.values.map((value) => (
                <button
                  aria-pressed={value.selected}
                  className="facet-value"
                  key={`${facet.field}-${value.start}-${value.end}`}
                  onClick={() => onToggleRange(facet.field, value.start, value.end)}
                  type="button"
                >
                  <span className="facet-checkbox" aria-hidden="true">
                    {value.selected ? <Check size={13} /> : null}
                  </span>
                  <span>{formatRangeValue(facet, value.start, value.end)}</span>
                  <span>{value.count.toLocaleString()}</span>
                </button>
              ))}
              {facet.domain ? (
                <p className="range-domain">
                  Available {formatRangeValue(facet, facet.domain.min, facet.domain.max)}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="facet-values">
              {facet.values.map((value) => (
                <button
                  aria-label={`${value.label} ${value.count.toLocaleString()}`}
                  aria-pressed={value.selected}
                  className="facet-value"
                  key={value.value}
                  onClick={() => onToggleFacetValue(facet.field, value.value, facet.type)}
                  type="button"
                >
                  <span className="facet-checkbox" aria-hidden="true">
                    {value.selected ? <Check size={13} /> : null}
                  </span>
                  <span>{value.label.split("|").at(-1)}</span>
                  <span>{value.count.toLocaleString()}</span>
                </button>
              ))}
            </div>
          )}
        </section>
      ))}
    </aside>
  );
}

export function toggleProductFacetSelection(
  selections: ProductFacetSelection[],
  field: string,
  value: string,
  type: "regular" | "hierarchical",
): ProductFacetSelection[] {
  const existing = selections.find(
    (selection) => selection.field === field && (selection.type === "regular" || selection.type === "hierarchical"),
  );

  if (!existing || existing.type === "numericalRange") {
    return [...selections, { field, type, values: [value] }];
  }

  const nextValues = existing.values.includes(value)
    ? existing.values.filter((item) => item !== value)
    : [...existing.values, value];

  return nextValues.length === 0
    ? selections.filter((selection) => selection !== existing)
    : selections.map((selection) => (selection === existing ? { field, type, values: nextValues } : selection));
}

export function toggleProductRangeSelection(
  selections: ProductFacetSelection[],
  field: string,
  start: number,
  end: number,
): ProductFacetSelection[] {
  const existing = selections.find(
    (selection) => selection.type === "numericalRange" && selection.field === field,
  );

  if (existing?.type === "numericalRange" && existing.start === start && existing.end === end) {
    return selections.filter((selection) => selection !== existing);
  }

  return [
    ...selections.filter((selection) => selection.field !== field),
    {
      end,
      field,
      start,
      type: "numericalRange" as const,
    },
  ];
}

function facetHasSelection(facet: ProductFacet) {
  if (facet.type === "numericalRange") {
    return Boolean(facet.selectedRange) || facet.values.some((value) => value.selected);
  }

  return facet.values.some((value) => value.selected);
}

function formatRangeValue(facet: ProductNumericalRangeFacet, start: number, end: number) {
  if (facet.field === "ec_price") {
    return `${formatCurrency(start)}-${formatCurrency(end)}`;
  }

  if (facet.field === "ec_rating") {
    return `${start}+ stars`;
  }

  return `${start}-${end}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    currency: "GBP",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    style: "currency",
  }).format(value);
}

function RatingFacetControl({
  facet,
  onClear,
  onSelect,
}: {
  facet: ProductNumericalRangeFacet;
  onClear: () => void;
  onSelect: (start: number, end: number) => void;
}) {
  const [hovered, setHovered] = useState<number | undefined>(undefined);
  const max = facet.domain?.max ?? 5;
  const selectedStart = facet.selectedRange?.start;
  const highlightThreshold = hovered ?? selectedStart;

  return (
    <div className="facet-rating" onMouseLeave={() => setHovered(undefined)} role="group" aria-label="Minimum rating">
      {RATING_STARS.map((star) => {
        const isActive = highlightThreshold !== undefined && star <= highlightThreshold;

        return (
          <button
            aria-label={`${star} star${star === 1 ? "" : "s"} & up`}
            aria-pressed={selectedStart !== undefined && star <= selectedStart}
            className="facet-rating-star"
            key={star}
            onClick={() => (selectedStart === star ? onClear() : onSelect(star, max))}
            onMouseEnter={() => setHovered(star)}
            type="button"
          >
            <Star aria-hidden="true" fill={isActive ? "currentColor" : "none"} size={18} />
          </button>
        );
      })}
      <span className="facet-rating-label">{selectedStart !== undefined ? `${selectedStart}+ stars` : "Any rating"}</span>
    </div>
  );
}

function PriceRangeFacetControl({
  facet,
  onChange,
}: {
  facet: ProductNumericalRangeFacet;
  onChange: (start: number, end: number) => void;
}) {
  const domain = facet.domain!;
  const externalRange: [number, number] = [facet.selectedRange?.start ?? domain.min, facet.selectedRange?.end ?? domain.max];
  const [appliedRange, setAppliedRange] = useState(externalRange);
  const [range, setRange] = useState(externalRange);

  // Re-sync local (draggable) state when the facet's applied range changes externally, e.g. after
  // "Clear" or a page navigation restores search parameters. Adjusting state during render (rather
  // than in an effect) avoids an extra render pass; see https://react.dev/learn/you-might-not-need-an-effect.
  if (externalRange[0] !== appliedRange[0] || externalRange[1] !== appliedRange[1]) {
    setAppliedRange(externalRange);
    setRange(externalRange);
  }

  const [min, max] = range;
  const span = domain.max - domain.min || 1;
  const percent = (value: number) => ((value - domain.min) / span) * 100;

  // Only update local (visual) state while dragging; the range is committed - via onChange, which
  // triggers the actual query - on pointerup/keyup so a fast drag doesn't fire a burst of
  // overlapping requests with no ordering guarantee between their responses.
  const handleMinChange = (value: number) => {
    setRange([Math.min(value, max), max]);
  };

  const handleMaxChange = (value: number) => {
    setRange([min, Math.max(value, min)]);
  };

  const commitRange = () => {
    onChange(range[0], range[1]);
  };

  return (
    <div className="facet-price-slider">
      <div
        className="range-slider"
        style={{ "--range-end": `${percent(max)}%`, "--range-start": `${percent(min)}%` } as CSSProperties}
      >
        <div className="range-slider-track" />
        <div className="range-slider-fill" />
        <input
          aria-label="Minimum price"
          max={domain.max}
          min={domain.min}
          onBlur={commitRange}
          onChange={(event) => handleMinChange(Number(event.target.value))}
          onKeyUp={commitRange}
          onPointerUp={commitRange}
          step={domain.increment}
          type="range"
          value={min}
        />
        <input
          aria-label="Maximum price"
          max={domain.max}
          min={domain.min}
          onBlur={commitRange}
          onChange={(event) => handleMaxChange(Number(event.target.value))}
          onKeyUp={commitRange}
          onPointerUp={commitRange}
          step={domain.increment}
          type="range"
          value={max}
        />
      </div>
      <p className="range-domain">
        {formatCurrency(min)} - {formatCurrency(max)}
      </p>
    </div>
  );
}
