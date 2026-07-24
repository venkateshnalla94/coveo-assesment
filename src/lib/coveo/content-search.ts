import sanitizeHtml from "sanitize-html";

import type { TrendingItem } from "@/features/trending/models/trending-models";
import {
  COVEO_SEARCH_API_BASE_URL,
  getSearchHub,
  optionalServerEnv,
  requiredServerEnv,
  withOrganizationId,
} from "@/lib/coveo/server-api";

const REASON_SENTENCE_PREVIEW_COUNT = 1;
const REASON_MAX_LENGTH = 160;

const ARTICLE_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
  },
  allowedTags: [
    "p", "br", "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li", "strong", "em", "b", "i", "a",
    "blockquote", "code", "pre",
  ],
  allowedSchemes: ["http", "https"],
  // Article body is untrusted third-party HTML from the source blog — force external links
  // to open safely rather than trusting whatever rel/target the source markup carried.
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
  },
};

function stringFrom(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function numberFrom(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function semicolonListFrom(value: unknown): string[] | undefined {
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }

  const items = value
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length > 0 ? items : undefined;
}

function dateFrom(value: unknown): string | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
  }

  return undefined;
}

// Coveo excerpts can come back as full ML-generated passages rather than short
// highlighted snippets; cap to one sentence so `reason` stays a blurb, not a paragraph.
function truncateReason(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const sentences = value.match(/[^.!?]+[.!?]+(\s+|$)/g);
  const preview = sentences?.slice(0, REASON_SENTENCE_PREVIEW_COUNT).join("").trim();
  const candidate = preview && preview.length < value.length ? `${preview}...` : (preview ?? value);

  if (candidate.length <= REASON_MAX_LENGTH) {
    return candidate;
  }

  return `${candidate.slice(0, REASON_MAX_LENGTH).trimEnd()}...`;
}

function mapResultToTrendingItem(
  result: unknown,
  index: number,
  options: { includeBody: boolean },
): TrendingItem | undefined {
  const item = result && typeof result === "object" ? (result as Record<string, unknown>) : {};
  const raw = item.raw && typeof item.raw === "object" ? (item.raw as Record<string, unknown>) : {};
  const title = stringFrom(item.title) ?? stringFrom(raw.title);
  const url = stringFrom(item.clickUri) ?? stringFrom(item.uri) ?? stringFrom(item.printableUri);

  if (!title || !url) {
    return undefined;
  }

  const trendingItem: TrendingItem = {
    id:
      stringFrom(raw.permanentid) ??
      stringFrom(item.uniqueId) ??
      stringFrom(item.rawUriHash) ??
      `live-resource-${index + 1}`,
    rank: index + 1,
    reason: truncateReason(stringFrom(item.excerpt) ?? stringFrom(raw.excerpt)),
    timeWindow: stringFrom(raw.source) ?? "Coveo Search API",
    title,
    type: stringFrom(raw.filetype) === "YouTubeVideo" ? "video" : "article",
    url,
    author: stringFrom(raw.author),
    category: stringFrom(raw.category),
    imageUrl: stringFrom(raw.featured_image_url),
    publishedAt: dateFrom(raw.date) ?? dateFrom(raw.created_date),
    tags: semicolonListFrom(raw.tags),
    wordCount: numberFrom(raw.word_count),
  };

  if (options.includeBody) {
    const rawBody = stringFrom(raw.content) ?? stringFrom(raw.body);
    trendingItem.body = rawBody ? sanitizeHtml(rawBody, ARTICLE_SANITIZE_OPTIONS) : undefined;
    // `images` mirrors `featured_image_url` as its first entry; drop that duplicate so the
    // gallery only shows the additional product shots, not the hero image twice.
    trendingItem.images = semicolonListFrom(raw.images)?.filter((url) => url !== trendingItem.imageUrl);
  }

  return trendingItem;
}

function resultsFrom(data: unknown): unknown[] {
  const body = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  return Array.isArray(body.results) ? body.results : [];
}

function baseSearchRequest(overrides: Record<string, unknown>) {
  return {
    enableDidYouMean: true,
    firstResult: 0,
    locale: optionalServerEnv("COVEO_COMMERCE_LANGUAGE") ?? "en",
    pipeline: optionalServerEnv("COVEO_CONTENT_PIPELINE") ?? optionalServerEnv("COVEO_PIPELINE"),
    searchHub: getSearchHub(optionalServerEnv("COVEO_CONTENT_SEARCH_HUB"), optionalServerEnv("COVEO_SEARCH_HUB")),
    ...overrides,
  };
}

export class CoveoContentRequestError extends Error {}

async function performCoveoSearch(requestBody: Record<string, unknown>) {
  const organizationId = requiredServerEnv("COVEO_ORGANIZATION_ID");
  const apiKey = requiredServerEnv("COVEO_PLATFORM_API_KEY");

  const response = await fetch(withOrganizationId(COVEO_SEARCH_API_BASE_URL, organizationId), {
    body: JSON.stringify(requestBody),
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new CoveoContentRequestError("Coveo content search request failed");
  }

  return response.json();
}

export async function searchTrendingContent(query: string, numberOfResults: number): Promise<TrendingItem[]> {
  const data = await performCoveoSearch(baseSearchRequest({ numberOfResults, q: query }));

  return resultsFrom(data)
    .map((result, index) => mapResultToTrendingItem(result, index, { includeBody: false }))
    .filter((item): item is TrendingItem => Boolean(item));
}

export async function fetchTrendingArticle(id: string): Promise<TrendingItem | undefined> {
  // permanentid is a Coveo-generated hash, but it arrives via a client-controlled route
  // param — escape it before interpolating into the query expression.
  const escapedId = id.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const data = await performCoveoSearch(
    baseSearchRequest({ aq: `@permanentid=="${escapedId}"`, numberOfResults: 1 }),
  );
  const [firstResult] = resultsFrom(data);

  return firstResult ? mapResultToTrendingItem(firstResult, 0, { includeBody: true }) : undefined;
}
