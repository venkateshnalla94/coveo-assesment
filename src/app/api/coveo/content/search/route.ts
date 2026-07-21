import { NextResponse } from "next/server";

import type { TrendingItem } from "@/features/trending/models/trending-models";
import {
  COVEO_SEARCH_API_BASE_URL,
  getSearchHub,
  optionalServerEnv,
  requiredServerEnv,
  withOrganizationId,
} from "@/lib/coveo/server-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

function normalizeBody(value: unknown) {
  const body = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const query = typeof body.query === "string" && body.query.trim() ? body.query.trim() : "robotics";
  const numberOfResults =
    typeof body.numberOfResults === "number" && Number.isFinite(body.numberOfResults)
      ? Math.min(8, Math.max(1, Math.floor(body.numberOfResults)))
      : 4;

  return { numberOfResults, query };
}

function stringFrom(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function mapContentSearchResults(value: unknown): TrendingItem[] {
  const body = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const results = Array.isArray(body.results) ? body.results : [];

  return results
    .map((result, index): TrendingItem | undefined => {
      const item = result && typeof result === "object" ? (result as Record<string, unknown>) : {};
      const raw = item.raw && typeof item.raw === "object" ? (item.raw as Record<string, unknown>) : {};
      const title = stringFrom(item.title) ?? stringFrom(raw.title);
      const url = stringFrom(item.clickUri) ?? stringFrom(item.uri) ?? stringFrom(item.printableUri);

      if (!title || !url) {
        return undefined;
      }

      return {
        id: stringFrom(item.uniqueId) ?? stringFrom(item.rawUriHash) ?? `live-resource-${index + 1}`,
        rank: index + 1,
        reason: stringFrom(item.excerpt) ?? stringFrom(raw.excerpt),
        timeWindow: stringFrom(raw.source) ?? "Coveo Search API",
        title,
        type: stringFrom(raw.filetype) === "YouTubeVideo" ? "video" : "article",
        url,
      };
    })
    .filter((item): item is TrendingItem => Boolean(item));
}

export async function POST(request: Request) {
  try {
    const organizationId = requiredServerEnv("COVEO_ORGANIZATION_ID");
    const apiKey = requiredServerEnv("COVEO_PLATFORM_API_KEY");
    const body = normalizeBody(await request.json().catch(() => ({})));

    const response = await fetch(withOrganizationId(COVEO_SEARCH_API_BASE_URL, organizationId), {
      body: JSON.stringify({
        enableDidYouMean: true,
        firstResult: 0,
        locale: optionalServerEnv("COVEO_COMMERCE_LANGUAGE") ?? "en",
        numberOfResults: body.numberOfResults,
        pipeline: optionalServerEnv("COVEO_CONTENT_PIPELINE") ?? optionalServerEnv("COVEO_PIPELINE"),
        q: body.query,
        searchHub: getSearchHub(optionalServerEnv("COVEO_CONTENT_SEARCH_HUB"), optionalServerEnv("COVEO_SEARCH_HUB")),
      }),
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Technical resources could not be loaded." }, { headers: noStoreHeaders, status: 502 });
    }

    return NextResponse.json({ items: mapContentSearchResults(await response.json()) }, { headers: noStoreHeaders });
  } catch {
    return NextResponse.json({ error: "Technical resources are not configured." }, { headers: noStoreHeaders, status: 500 });
  }
}
