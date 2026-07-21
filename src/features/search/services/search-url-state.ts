import type { DemoProfileId } from "@/features/demo-profiles/demo-profiles";
import { isDemoProfileId } from "@/features/demo-profiles/demo-profiles";
import type { DevelopmentScenario } from "@/features/development/scenarios";
import { isDevelopmentScenario } from "@/features/development/scenarios";
import type { SearchQuery } from "@/features/search/models/search-models";
import { DEFAULT_SEARCH_QUERY } from "@/features/search/services/search-query";
import { normalizeSearchSort } from "@/features/search/services/sort-options";

export type SearchUrlState = {
  query?: string;
  page: number;
  sort: string;
  filters: Record<string, string[]>;
  profile?: DemoProfileId;
  scenario?: DevelopmentScenario;
};

export type UrlFacetConfiguration = {
  field: string;
  parameter: string;
};

export const DEFAULT_URL_FACETS: readonly UrlFacetConfiguration[] = Object.freeze([
  { field: "filetype", parameter: "contentType" },
  { field: "source", parameter: "source" },
  { field: "product", parameter: "product" },
]);

export function parseSearchUrlState(
  input: URLSearchParams | Record<string, string | string[] | undefined>,
  options: {
    allowedFacets?: readonly UrlFacetConfiguration[];
    allowDevelopmentParameters?: boolean;
  } = {},
): SearchUrlState {
  const params = input instanceof URLSearchParams ? input : objectToSearchParams(input);
  const allowedFacets = options.allowedFacets ?? DEFAULT_URL_FACETS;
  const page = Number.parseInt(params.get("page") ?? "", 10);
  const filters = Object.fromEntries(
    allowedFacets
      .map((facet) => [
        facet.field,
        uniqueValues(params.getAll(facet.parameter).flatMap((value) => value.split(","))),
      ])
      .filter(([, values]) => values.length > 0),
  );
  const profile = options.allowDevelopmentParameters ? params.get("profile") ?? undefined : undefined;
  const scenario = options.allowDevelopmentParameters
    ? params.get("scenario") ?? undefined
    : undefined;

  return normalizeSearchUrlState({
    filters,
    page,
    profile: isDemoProfileId(profile) ? profile : undefined,
    query: params.get("q") ?? undefined,
    scenario: isDevelopmentScenario(scenario) ? scenario : undefined,
    sort: params.get("sort") ?? "relevance",
  });
}

export function normalizeSearchUrlState(state: Partial<SearchUrlState>): SearchUrlState {
  return {
    filters: Object.fromEntries(
      Object.entries(state.filters ?? {})
        .map(([field, values]) => [field, uniqueValues(values)])
        .filter(([, values]) => values.length > 0),
    ),
    page: Number.isInteger(state.page) && Number(state.page) > 0 ? Number(state.page) : 1,
    profile: state.profile,
    query: state.query?.trim() || undefined,
    scenario: state.scenario,
    sort: normalizeSearchSort(state.sort ?? "relevance"),
  };
}

export function serializeSearchUrlState(
  state: SearchUrlState,
  options: {
    allowedFacets?: readonly UrlFacetConfiguration[];
    includeDevelopmentParameters?: boolean;
  } = {},
): string {
  const normalized = normalizeSearchUrlState(state);
  const params = new URLSearchParams();
  const allowedFacets = options.allowedFacets ?? DEFAULT_URL_FACETS;

  if (normalized.query) {
    params.set("q", normalized.query);
  }

  if (normalized.page > 1) {
    params.set("page", String(normalized.page));
  }

  if (normalized.sort !== "relevance") {
    params.set("sort", normalized.sort);
  }

  for (const facet of allowedFacets) {
    for (const value of normalized.filters[facet.field] ?? []) {
      params.append(facet.parameter, value);
    }
  }

  if (options.includeDevelopmentParameters) {
    if (normalized.profile) {
      params.set("profile", normalized.profile);
    }

    if (normalized.scenario && normalized.scenario !== "default") {
      params.set("scenario", normalized.scenario);
    }
  }

  return params.toString();
}

export function searchQueryFromUrlState(state: SearchUrlState): SearchQuery {
  return {
    ...DEFAULT_SEARCH_QUERY,
    filters: state.filters,
    page: state.page,
    query: state.query ?? DEFAULT_SEARCH_QUERY.query,
    sort: state.sort,
  };
}

export function searchUrlStateFromQuery(
  query: SearchQuery,
  development?: Pick<SearchUrlState, "profile" | "scenario">,
): SearchUrlState {
  return normalizeSearchUrlState({
    filters: query.filters,
    page: query.page,
    profile: development?.profile,
    query: query.query,
    scenario: development?.scenario,
    sort: query.sort,
  });
}

function objectToSearchParams(input: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(input)) {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    } else if (value !== undefined) {
      params.set(key, value);
    }
  }

  return params;
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort();
}
