import { useMemo, useState } from "react";

import type {
  CoveoSearchResponse,
  SearchResponseFacet,
  SearchResponseResult,
} from "@/components/search/response/search-response-types";
import { SEARCH_UI } from "@/components/search/search-ui.constants";

type SelectedFacetValues = Record<string, string[]>;

function getInitialSelectedFacetValues(facets: SearchResponseFacet[]) {
  return facets.reduce<SelectedFacetValues>((selectedValues, facet) => {
    const selectedFacetValues = facet.values
      .filter((value) => value.state === "selected" && value.value !== "All")
      .map((value) => value.value);

    if (selectedFacetValues.length > 0) {
      selectedValues[facet.field] = selectedFacetValues;
    }

    return selectedValues;
  }, {});
}

function resultMatchesFacet(
  result: SearchResponseResult,
  facetField: string,
  selectedValues: string[],
) {
  if (selectedValues.length === 0) {
    return true;
  }

  if (facetField === "filetype") {
    return selectedValues.some((value) => value.toLowerCase() === result.filetype?.toLowerCase());
  }

  if (facetField === "source") {
    return selectedValues.includes(result.source ?? "");
  }

  return true;
}

export function useSearchResponseState(response: CoveoSearchResponse) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFacetValues, setSelectedFacetValues] = useState<SelectedFacetValues>(() =>
    getInitialSelectedFacetValues(response.facets),
  );

  const filteredResults = useMemo(
    () =>
      response.results.filter((result) =>
        Object.entries(selectedFacetValues).every(([field, selectedValues]) =>
          resultMatchesFacet(result, field, selectedValues),
        ),
      ),
    [response.results, selectedFacetValues],
  );

  const maxPage = Math.max(1, Math.ceil(filteredResults.length / SEARCH_UI.pagination.pageSize));
  const safeCurrentPage = Math.min(currentPage, maxPage);
  const startIndex = (safeCurrentPage - 1) * SEARCH_UI.pagination.pageSize;
  const pagedResults = filteredResults.slice(startIndex, startIndex + SEARCH_UI.pagination.pageSize);

  function clearFacets() {
    setSelectedFacetValues({});
    setCurrentPage(1);
  }

  function toggleFacetValue(field: string, value: string) {
    setSelectedFacetValues((currentValues) => {
      if (value === "All") {
        return { ...currentValues, [field]: [] };
      }

      const selectedValues = currentValues[field] ?? [];
      const nextValues = selectedValues.includes(value)
        ? selectedValues.filter((selectedValue) => selectedValue !== value)
        : [...selectedValues, value];

      return {
        ...currentValues,
        [field]: nextValues,
      };
    });
    setCurrentPage(1);
  }

  const facets = response.facets.map((facet) => {
    const selectedValues = selectedFacetValues[facet.field] ?? [];

    return {
      ...facet,
      values: facet.values.map((value) => ({
        ...value,
        state:
          value.value === "All"
            ? selectedValues.length === 0
              ? "selected"
              : "idle"
            : selectedValues.includes(value.value)
              ? "selected"
              : "idle",
      })),
    } satisfies SearchResponseFacet;
  });

  return {
    clearFacets,
    currentPage: safeCurrentPage,
    facets,
    firstResult: filteredResults.length === 0 ? 0 : startIndex + 1,
    lastResult: startIndex + pagedResults.length,
    maxPage,
    pagedResults,
    selectPage: setCurrentPage,
    toggleFacetValue,
    totalCount: filteredResults.length,
  };
}
