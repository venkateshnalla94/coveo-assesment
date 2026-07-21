import type { SearchResult, SearchResultType } from "@/features/search/models/search-models";

export type ResultVariant = SearchResultType | "default";

export function getResultVariant(result: Pick<SearchResult, "type">): ResultVariant {
  switch (result.type) {
    case "article":
    case "community":
    case "documentation":
    case "product":
    case "video":
      return result.type;
    default:
      return "default";
  }
}

export function getSafeResultUrl(result: Pick<SearchResult, "url">): string {
  try {
    const url = new URL(result.url);

    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
  } catch {
    return "#";
  }

  return "#";
}

export function getResultDescription(result: Pick<SearchResult, "description">): string | undefined {
  return result.description.trim().length > 0 ? result.description : undefined;
}

export function getResultDateLabel(date: string | undefined) {
  if (!date) {
    return undefined;
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}
