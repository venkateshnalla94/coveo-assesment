import { Check, ChevronDown, X } from "lucide-react";

import type {
  ProductFacet,
  ProductFacetSelection,
  ProductNumericalRangeFacet,
} from "@/features/commerce/models/commerce-models";

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
      return facet.values
        .filter((value) => value.selected)
        .map((value) => ({
          field: facet.field,
          label: `${facet.label}: ${formatRangeValue(facet, value.start, value.end)}`,
        }));
    }

    return facet.values
      .filter((value) => value.selected)
      .map((value) => ({ field: facet.field, label: `${facet.label}: ${value.label}` }));
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
            <button key={`${filter.field}-${filter.label}`} onClick={() => onClearFacet(filter.field)} type="button">
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

          {facet.type === "numericalRange" ? (
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
  return facet.values.some((value) => value.selected);
}

function formatRangeValue(facet: ProductNumericalRangeFacet, start: number, end: number) {
  if (facet.field === "ec_price") {
    return `${formatCurrency(start)}-${formatCurrency(end)}`;
  }

  if (facet.field === "ec_rating") {
    return `${start.toFixed(1)}-${end.toFixed(1)}`;
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
