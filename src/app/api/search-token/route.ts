import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SearchTokenSuccess = {
  token: string;
};

type SearchTokenPayload = {
  userIds: Array<{
    name: string;
    provider: string;
    type: "User";
  }>;
  searchHub?: string;
  pipeline?: string;
  userDisplayName?: string;
};

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function optionalEnv(name: string) {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : undefined;
}

function buildTokenPayload(): SearchTokenPayload {
  const searchHub = optionalEnv("COVEO_SEARCH_HUB");
  const pipeline = optionalEnv("COVEO_PIPELINE");

  return {
    userIds: [
      {
        name: optionalEnv("COVEO_USER_ID") ?? "anonymous",
        provider: optionalEnv("COVEO_IDENTITY_PROVIDER") ?? "Email Security Provider",
        type: "User",
      },
    ],
    ...(searchHub ? { searchHub } : {}),
    ...(pipeline ? { pipeline } : {}),
    userDisplayName: "Assessment visitor",
  };
}

function tokenEndpoints(organizationId: string) {
  const explicitEndpoint = optionalEnv("COVEO_SEARCH_TOKEN_ENDPOINT");

  if (explicitEndpoint) {
    return [explicitEndpoint];
  }

  const encodedOrganizationId = encodeURIComponent(organizationId);
  const orgBaseUrl = `https://${organizationId}.org.coveo.com`;

  return [
    `${orgBaseUrl}/rest/search/v2/token?organizationId=${encodedOrganizationId}`,
    `${orgBaseUrl}/rest/search/token?organizationId=${encodedOrganizationId}`,
  ];
}

async function requestSearchToken(endpoint: string, apiKey: string, payload: SearchTokenPayload) {
  return fetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
}

export async function GET() {
  try {
    const organizationId = requiredEnv("COVEO_ORGANIZATION_ID");
    const apiKey = requiredEnv("COVEO_PLATFORM_API_KEY");
    const payload = buildTokenPayload();
    const endpoints = tokenEndpoints(organizationId);

    let response: Response | undefined;

    for (const endpoint of endpoints) {
      response = await requestSearchToken(endpoint, apiKey, payload);

      if (response.ok || response.status !== 404) {
        break;
      }
    }

    if (!response?.ok) {
      return NextResponse.json(
        {
          error: "Unable to mint Coveo search token.",
          status: response?.status ?? 500,
        },
        { status: 502, headers: noStoreHeaders },
      );
    }

    const data = (await response.json()) as Partial<SearchTokenSuccess>;

    if (!data.token) {
      return NextResponse.json(
        { error: "Coveo token response did not include a token." },
        { status: 502, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        token: data.token,
        organizationId,
        searchHub: payload.searchHub ?? "",
        pipeline: payload.pipeline ?? "",
        facetFields: (optionalEnv("COVEO_FACET_FIELDS") ?? "source,filetype")
          .split(",")
          .map((field) => field.trim())
          .filter(Boolean),
      },
      { headers: noStoreHeaders },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown token error.";

    return NextResponse.json({ error: message }, { status: 500, headers: noStoreHeaders });
  }
}
