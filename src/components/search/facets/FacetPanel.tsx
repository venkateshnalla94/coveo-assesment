"use client";

import type { Facet } from "@coveo/headless";
import { Check, ChevronDown } from "lucide-react";

import { useControllerState } from "@/lib/coveo/use-controller-state";

function labelFromField(field: string) {
  return field
    .replace(/^@/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function FacetPanel({
  field,
  controller,
  onClearFacet,
  onToggleValue,
}: {
  field: string;
  controller: Facet;
  onClearFacet?: (field: string) => void;
  onToggleValue?: (field: string, value: string, selected: boolean) => void;
}) {
  const state = useControllerState(controller);

  if (!state.enabled || (!state.isLoading && state.values.length === 0)) {
    return null;
  }

  return (
    <section className="facet-panel">
      <div className="facet-header">
        <h2>{labelFromField(field)}</h2>
        <div className="facet-header-actions">
          {state.hasActiveValues ? (
            <button
              className="link-button"
              onClick={() => {
                onClearFacet?.(field);
                controller.deselectAll();
              }}
              type="button"
            >
              Clear
            </button>
          ) : null}
          <ChevronDown aria-hidden="true" size={16} />
        </div>
      </div>

      <div className="facet-values">
        {state.values.map((value) => {
          const isSelected = controller.isValueSelected(value);

          return (
            <button
              aria-label={`${value.value} ${value.numberOfResults.toLocaleString()}`}
              aria-pressed={isSelected}
              className="facet-value"
              key={value.value}
              onClick={() => {
                onToggleValue?.(field, value.value, !isSelected);
                controller.toggleSelect(value);
              }}
              type="button"
            >
              <span className="facet-checkbox" aria-hidden="true">
                {isSelected ? <Check size={13} /> : null}
              </span>
              <span>{value.value}</span>
              <span>{value.numberOfResults.toLocaleString()}</span>
            </button>
          );
        })}
      </div>

      <div className="facet-actions">
        {state.canShowMoreValues ? (
          <button className="link-button" onClick={() => controller.showMoreValues()} type="button">
            More
          </button>
        ) : null}
        {state.canShowLessValues ? (
          <button className="link-button" onClick={() => controller.showLessValues()} type="button">
            Less
          </button>
        ) : null}
      </div>
    </section>
  );
}
