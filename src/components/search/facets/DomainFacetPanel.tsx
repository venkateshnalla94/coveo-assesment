import { Check, ChevronDown, X } from "lucide-react";

import { SEARCH_UI } from "@/components/search/search-ui.constants";
import type { SearchFacet } from "@/features/search/models/search-models";

export function DomainFacetPanel({
  facets,
  onClearAll,
  onClearFacet,
  onToggleValue,
}: {
  facets: SearchFacet[];
  onClearAll: () => void;
  onClearFacet: (field: string) => void;
  onToggleValue: (field: string, value: string) => void;
}) {
  const activeFilters = facets.flatMap((facet) =>
    facet.values
      .filter((value) => value.selected && !isAllValue(value.value))
      .map((value) => ({ field: facet.field, label: `${facet.label}: ${value.label}`, value: value.value })),
  );

  return (
    <aside className="facet-sidebar" aria-label="Search filters">
      <div className="facet-sidebar-header">
        <h2>{SEARCH_UI.facets.title}</h2>
        <button
          className="link-button"
          disabled={activeFilters.length === 0}
          onClick={onClearAll}
          type="button"
        >
          {SEARCH_UI.facets.clearAllLabel}
        </button>
      </div>

      {activeFilters.length > 0 ? (
        <div className="active-filters" aria-label="Active filters">
          {activeFilters.map((filter) => (
            <button
              key={`${filter.field}-${filter.value}`}
              onClick={() => onToggleValue(filter.field, filter.value)}
              type="button"
            >
              {filter.label}
              <X aria-hidden="true" size={14} />
            </button>
          ))}
        </div>
      ) : null}

      {facets.map((facet) => {
        const hasSelectedValues = facet.values.some(
          (value) => value.selected && !isAllValue(value.value),
        );

        return (
          <section className="facet-panel" key={facet.id}>
            <div className="facet-header">
              <h2>{facet.label}</h2>
              <div className="facet-header-actions">
                {hasSelectedValues ? (
                  <button className="link-button" onClick={() => onClearFacet(facet.field)} type="button">
                    Clear
                  </button>
                ) : null}
                <ChevronDown aria-hidden="true" size={16} />
              </div>
            </div>

            <div className="facet-values">
              {facet.values.map((value) => {
                const isSelected = value.selected;

                return (
                  <button
                    aria-label={`${value.label} ${value.count.toLocaleString()}`}
                    aria-pressed={isSelected}
                    className="facet-value"
                    key={value.value}
                    onClick={() => onToggleValue(facet.field, value.value)}
                    type="button"
                  >
                    <span className="facet-checkbox" aria-hidden="true">
                      {isSelected ? <Check size={13} /> : null}
                    </span>
                    <span>{value.label}</span>
                    <span>{value.count.toLocaleString()}</span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </aside>
  );
}

function isAllValue(value: string) {
  const normalizedValue = value.toLowerCase();
  return normalizedValue === "all" || normalizedValue === "any time";
}
