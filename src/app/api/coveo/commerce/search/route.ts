import { randomUUID } from "crypto";

import { NextResponse } from "next/server";

import { COMMERCE_DEFAULTS, getCommerceFacetLabel } from "@/features/commerce/config/commerce-config";
import { mapCommerceSearchResponse } from "@/features/commerce/mappers/commerce-response-mapper";
import type {
  ProductFacetSelection,
  ProductSearchRequest,
} from "@/features/commerce/models/commerce-models";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

function optionalEnv(name: string) {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : undefined;
}

function requiredEnv(name: string) {
  const value = optionalEnv(name);

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getCommerceEndpoint(organizationId: string) {
  return (
    optionalEnv("COVEO_COMMERCE_SEARCH_ENDPOINT") ??
    `https://platform-eu.cloud.coveo.com/rest/organizations/${encodeURIComponent(
      organizationId,
    )}/commerce/v2/search`
  );
}

function normalizeRequest(value: unknown): ProductSearchRequest & { clientId: string } {
  const body = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const page = typeof body.page === "number" && Number.isFinite(body.page) ? body.page : 0;
  const perPage =
    typeof body.perPage === "number" && Number.isFinite(body.perPage)
      ? body.perPage
      : COMMERCE_DEFAULTS.perPage;

  return {
    clientId: typeof body.clientId === "string" && body.clientId.trim() ? body.clientId : randomUUID(),
    facets: Array.isArray(body.facets) ? body.facets.map(normalizeFacetSelection).filter(isFacetSelection) : [],
    page: Math.max(0, Math.floor(page)),
    perPage: Math.min(48, Math.max(1, Math.floor(perPage))),
    query: typeof body.query === "string" ? body.query : "",
  };
}

function normalizeFacetSelection(value: unknown): ProductFacetSelection | undefined {
  const selection = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const field = typeof selection.field === "string" ? selection.field : "";
  const type = typeof selection.type === "string" ? selection.type : "";

  if (!field) {
    return undefined;
  }

  if ((type === "regular" || type === "hierarchical") && Array.isArray(selection.values)) {
    return {
      field,
      type,
      values: selection.values.filter((item): item is string => typeof item === "string"),
    };
  }

  if (
    type === "numericalRange" &&
    typeof selection.start === "number" &&
    typeof selection.end === "number"
  ) {
    return {
      end: selection.end,
      field,
      start: selection.start,
      type,
    };
  }

  return undefined;
}

function isFacetSelection(value: ProductFacetSelection | undefined): value is ProductFacetSelection {
  return Boolean(value);
}

function buildCommerceFacetRequests(selections: ProductFacetSelection[]) {
  return selections.map((selection) => {
    const baseFacet = {
      displayName: getCommerceFacetLabel(selection.field),
      facetId: selection.field,
      field: selection.field,
      type: selection.type,
    };

    if (selection.type === "numericalRange") {
      return {
        ...baseFacet,
        numberOfValues: 1,
        values: [
          {
            end: selection.end,
            endInclusive: true,
            start: selection.start,
            state: "selected",
          },
        ],
      };
    }

    return {
      ...baseFacet,
      ...(selection.type === "hierarchical" ? { delimitingCharacter: "|" } : {}),
      values: selection.values.map((value) => ({
        state: "selected",
        value,
      })),
    };
  });
}

export async function POST(request: Request) {
  try {
    const organizationId = requiredEnv("COVEO_ORGANIZATION_ID");
    const apiKey = requiredEnv("COVEO_PLATFORM_API_KEY");
    const body = normalizeRequest(await request.json().catch(() => ({})));
    const commercePayload = {
      clientId: body.clientId,
      context: {
        cart: [],
        view: {
          url: COMMERCE_DEFAULTS.viewUrl,
        },
      },
      country: optionalEnv("COVEO_COMMERCE_COUNTRY") ?? COMMERCE_DEFAULTS.country,
      currency: optionalEnv("COVEO_COMMERCE_CURRENCY") ?? COMMERCE_DEFAULTS.currency,
      language: optionalEnv("COVEO_COMMERCE_LANGUAGE") ?? COMMERCE_DEFAULTS.language,
      page: body.page,
      perPage: body.perPage,
      query: body.query,
      trackingId: optionalEnv("COVEO_COMMERCE_TRACKING_ID") ?? COMMERCE_DEFAULTS.trackingId,
    };
    const commerceFacets = buildCommerceFacetRequests(body.facets);

    const response = await fetch(getCommerceEndpoint(organizationId), {
      body: JSON.stringify({
        ...commercePayload,
        ...(commerceFacets.length > 0 ? { facets: commerceFacets } : {}),
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
      return NextResponse.json(
        {
          error: "Commerce search could not be loaded.",
          status: response.status,
        },
        { headers: noStoreHeaders, status: 502 },
      );
    }

    const data = await response.json();

    return NextResponse.json(mapCommerceSearchResponse(data, body.facets), {
      headers: noStoreHeaders,
    });
  } catch {
    return NextResponse.json(
      { error: "Commerce search is not configured." },
      { headers: noStoreHeaders, status: 500 },
    );
  }
}
