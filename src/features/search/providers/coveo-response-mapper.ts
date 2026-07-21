import type {
  FacetValue,
  SearchFacet,
  SearchResponse,
  SearchResult,
  SearchResultType,
} from "@/features/search/models/search-models";

export type RawCoveoFacetValue = {
  numberOfResults?: unknown;
  state?: unknown;
  value?: unknown;
};

export type RawCoveoFacet = {
  field?: unknown;
  label?: unknown;
  values?: unknown;
};

export type RawCoveoResult = {
  author?: unknown;
  clickUri?: unknown;
  date?: unknown;
  excerpt?: unknown;
  filetype?: unknown;
  printableUri?: unknown;
  source?: unknown;
  tags?: unknown;
  thumbnail?: unknown;
  title?: unknown;
  uniqueId?: unknown;
};

export type RawCoveoSearchResponse = {
  durationInSeconds?: unknown;
  facets?: unknown;
  query?: unknown;
  results?: unknown;
  searchHub?: unknown;
  totalCount?: unknown;
};

const fallbackResultTitle = "Untitled result";

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

function mapFiletypeToResultType(filetype: string | undefined): SearchResultType {
  switch (filetype?.toLowerCase()) {
    case "html":
    case "web":
      return "article";
    case "ppt":
    case "pptx":
      return "video";
    case "pdf":
    case "doc":
    case "docx":
    case "xls":
    case "xlsx":
      return "documentation";
    default:
      return "article";
  }
}

function inferResultType({
  filetype,
  source,
  tags,
  title,
  url,
}: {
  filetype: string | undefined;
  source: string | undefined;
  tags: string[];
  title: string;
  url: string;
}): SearchResultType {
  const searchableText = [source, title, url, ...tags].join(" ").toLowerCase();

  if (searchableText.includes("community")) {
    return "community";
  }

  if (
    searchableText.includes("product") ||
    searchableText.includes("/products") ||
    searchableText.includes("/solutions")
  ) {
    return "product";
  }

  return mapFiletypeToResultType(filetype);
}

function mapResult(rawResult: unknown, index: number): SearchResult {
  const result = rawResult && typeof rawResult === "object" ? (rawResult as RawCoveoResult) : {};
  const filetype = asString(result.filetype);
  const tags = asStringArray(result.tags);
  const source = asString(result.source);
  const url = asString(result.clickUri) ?? "#";
  const title = asString(result.title) ?? fallbackResultTitle;

  return {
    id: asString(result.uniqueId) ?? `mock-result-${index + 1}`,
    title,
    description: asString(result.excerpt) ?? "",
    url,
    type: inferResultType({ filetype, source, tags, title, url }),
    ...(asString(result.author) ? { author: asString(result.author) } : {}),
    ...(tags.length > 0 ? { badges: tags } : {}),
    ...(asString(result.printableUri) ? { displayUrl: asString(result.printableUri) } : {}),
    ...(asString(result.thumbnail) ? { imageUrl: asString(result.thumbnail) } : {}),
    metadata: {
      filetype: filetype ?? null,
      popularity: Math.max(0, 1000 - index),
    },
    ...(source ? { source } : {}),
    ...(asString(result.date) ? { updatedAt: asString(result.date) } : {}),
  };
}

function mapFacetValue(rawValue: unknown): FacetValue | undefined {
  const facetValue = rawValue && typeof rawValue === "object" ? (rawValue as RawCoveoFacetValue) : {};
  const value = asString(facetValue.value);

  if (!value) {
    return undefined;
  }

  return {
    value,
    label: value,
    count: asNumber(facetValue.numberOfResults) ?? 0,
    selected: facetValue.state === "selected",
  };
}

function mapFacet(rawFacet: unknown, index: number): SearchFacet | undefined {
  const facet = rawFacet && typeof rawFacet === "object" ? (rawFacet as RawCoveoFacet) : {};
  const field = asString(facet.field);

  if (!field) {
    return undefined;
  }

  const values = Array.isArray(facet.values)
    ? facet.values.map(mapFacetValue).filter((value): value is FacetValue => Boolean(value))
    : [];

  return {
    id: `mock-facet-${field || index + 1}`,
    field,
    label: asString(facet.label) ?? field,
    values,
  };
}

export function mapCoveoSearchResponse(rawResponse: unknown): SearchResponse {
  const response =
    rawResponse && typeof rawResponse === "object" ? (rawResponse as RawCoveoSearchResponse) : {};
  const results = Array.isArray(response.results)
    ? response.results.map((result, index) => mapResult(result, index))
    : [];
  const facets = Array.isArray(response.facets)
    ? response.facets.map(mapFacet).filter((facet): facet is SearchFacet => Boolean(facet))
    : [];
  const totalCount = asNumber(response.totalCount) ?? results.length;
  const durationInSeconds = asNumber(response.durationInSeconds);

  return {
    results,
    facets,
    totalCount,
    ...(durationInSeconds !== undefined ? { durationMs: Math.round(durationInSeconds * 1000) } : {}),
    ...(asString(response.query) ? { query: asString(response.query) } : {}),
    ...(asString(response.searchHub) ? { searchHub: asString(response.searchHub) } : {}),
  };
}
