import { NextResponse } from "next/server";

import type { SearchSuggestion } from "@/features/search/models/search-models";
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

function normalizeQuery(value: unknown) {
  const body = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return typeof body.query === "string" ? body.query.trim() : "";
}

function mapSuggestions(value: unknown): SearchSuggestion[] {
  const body = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const completions = Array.isArray(body.completions) ? body.completions : [];

  return completions
    .map((completion, index): SearchSuggestion | undefined => {
      const item = completion && typeof completion === "object" ? (completion as Record<string, unknown>) : {};
      const expression = typeof item.expression === "string" ? item.expression.trim() : "";

      if (!expression) {
        return undefined;
      }

      return {
        id: `live-commerce-suggestion-${index}-${expression.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`,
        label: expression,
        value: expression,
      };
    })
    .filter((suggestion): suggestion is SearchSuggestion => Boolean(suggestion))
    .slice(0, 6);
}

export async function POST(request: Request) {
  try {
    const organizationId = requiredServerEnv("COVEO_ORGANIZATION_ID");
    const apiKey = requiredServerEnv("COVEO_PLATFORM_API_KEY");
    const query = normalizeQuery(await request.json().catch(() => ({})));

    if (!query) {
      return NextResponse.json({ suggestions: [] }, { headers: noStoreHeaders });
    }

    const response = await fetch(withOrganizationId(`${COVEO_SEARCH_API_BASE_URL}/querySuggest`, organizationId), {
      body: JSON.stringify({
        count: 6,
        locale: optionalServerEnv("COVEO_COMMERCE_LANGUAGE") ?? "en",
        pipeline: optionalServerEnv("COVEO_QUERY_SUGGEST_PIPELINE") ?? optionalServerEnv("COVEO_COMMERCE_PIPELINE"),
        q: query,
        searchHub: getSearchHub(
          optionalServerEnv("COVEO_QUERY_SUGGEST_SEARCH_HUB"),
          optionalServerEnv("COVEO_SEARCH_HUB"),
          optionalServerEnv("COVEO_COMMERCE_TRACKING_ID"),
        ),
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
      return NextResponse.json({ error: "Query suggestions could not be loaded." }, { headers: noStoreHeaders, status: 502 });
    }

    return NextResponse.json({ suggestions: mapSuggestions(await response.json()) }, { headers: noStoreHeaders });
  } catch {
    return NextResponse.json({ error: "Query suggestions are not configured." }, { headers: noStoreHeaders, status: 500 });
  }
}
