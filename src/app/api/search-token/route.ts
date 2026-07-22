import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SearchTokenSuccess = {
  token: string;
};

type CoveoTokenEndpointKind = "explicit" | "search-v2-token" | "search-token";

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

type SanitizedUpstreamError = {
  service: "search-token";
  endpoint: CoveoTokenEndpointKind;
  status: number;
  errorCode?: string;
  responseShape: string;
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

function tokenEndpoints(organizationId: string): Array<{
  kind: CoveoTokenEndpointKind;
  url: string;
}> {
  const explicitEndpoint = optionalEnv("COVEO_SEARCH_TOKEN_ENDPOINT");

  if (explicitEndpoint) {
    return [{ kind: "explicit", url: explicitEndpoint }];
  }

  const encodedOrganizationId = encodeURIComponent(organizationId);
  const orgBaseUrl = `https://${organizationId}.org.coveo.com`;

  return [
    {
      kind: "search-v2-token",
      url: `${orgBaseUrl}/rest/search/v2/token?organizationId=${encodedOrganizationId}`,
    },
    {
      kind: "search-token",
      url: `${orgBaseUrl}/rest/search/token?organizationId=${encodedOrganizationId}`,
    },
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
    const authMode = requiredEnv("COVEO_AUTH_MODE");

    if (authMode !== "search-token") {
      return NextResponse.json(
        {
          code: "CONFIGURATION_ERROR",
          error: "/api/search-token is only available when COVEO_AUTH_MODE=search-token.",
        },
        { status: 400, headers: noStoreHeaders },
      );
    }

    const organizationId = requiredEnv("COVEO_ORGANIZATION_ID");
    const apiKey = requiredEnv("COVEO_AUTHENTICATED_SEARCH_API_KEY");
    const payload = buildTokenPayload();
    const endpoints = tokenEndpoints(organizationId);

    let response: Response | undefined;
    let endpointKind: CoveoTokenEndpointKind = endpoints[0]?.kind ?? "search-v2-token";
    let upstreamError: SanitizedUpstreamError | undefined;

    for (const endpoint of endpoints) {
      endpointKind = endpoint.kind;
      response = await requestSearchToken(endpoint.url, apiKey, payload);

      if (response.ok || response.status !== 404) {
        break;
      }
    }

    if (!response?.ok) {
      if (response) {
        upstreamError = await sanitizeUpstreamError(response, endpointKind);
      }

      return NextResponse.json(
        {
          code: "TOKEN_MINT_FAILED",
          error: "Unable to mint Coveo search token.",
          upstream: upstreamError ?? {
            endpoint: endpointKind,
            responseShape: "empty",
            service: "search-token",
            status: response?.status ?? 500,
          },
        },
        { status: 502, headers: noStoreHeaders },
      );
    }

    const data = (await response.json()) as Partial<SearchTokenSuccess>;

    if (!data.token) {
      return NextResponse.json(
        {
          code: "TOKEN_RESPONSE_INVALID",
          error: "Coveo token response did not include a token.",
          upstream: {
            endpoint: endpointKind,
            responseShape: getResponseShape(data),
            service: "search-token",
            status: response.status,
          },
        },
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

    return NextResponse.json(
      { code: "CONFIGURATION_ERROR", error: message },
      { status: 500, headers: noStoreHeaders },
    );
  }
}

async function sanitizeUpstreamError(
  response: Response,
  endpoint: CoveoTokenEndpointKind,
): Promise<SanitizedUpstreamError> {
  const contentType = response.headers.get("Content-Type") ?? "";
  const text = await response.text().catch(() => "");
  const parsed = contentType.includes("application/json") ? parseJson(text) : undefined;

  return {
    ...(extractErrorCode(parsed) ? { errorCode: extractErrorCode(parsed) } : {}),
    endpoint,
    responseShape: parsed ? getResponseShape(parsed) : text ? "text" : "empty",
    service: "search-token",
    status: response.status,
  };
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

function extractErrorCode(value: unknown): string | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const directCode = record.code ?? record.errorCode;

  if (typeof directCode === "string") {
    return directCode;
  }

  const error = record.error;

  if (error && typeof error === "object") {
    const nestedCode = (error as Record<string, unknown>).code;
    return typeof nestedCode === "string" ? nestedCode : undefined;
  }

  return undefined;
}

function getResponseShape(value: unknown): string {
  if (Array.isArray(value)) {
    return "array";
  }

  if (!value || typeof value !== "object") {
    return typeof value;
  }

  return `object:${Object.keys(value as Record<string, unknown>).sort().join(",")}`;
}
