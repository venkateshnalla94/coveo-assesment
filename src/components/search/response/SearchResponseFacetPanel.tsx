import { Check, ChevronDown } from "lucide-react";

import type { SearchResponseFacet } from "@/components/search/response/search-response-types";

export function SearchResponseFacetPanel({
  facet,
  onToggleValue,
}: {
  facet: SearchResponseFacet;
  onToggleValue: (field: string, value: string) => void;
}) {
  return (
    <section className="facet-panel">
      <div className="facet-header">
        <h2>{facet.label}</h2>
        <div className="facet-header-actions">
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
}
