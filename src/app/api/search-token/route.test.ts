import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

type SearchTokenResponse = {
  token?: string;
  organizationId?: string;
  searchHub?: string;
  pipeline?: string;
  facetFields?: string[];
  code?: string;
  error?: string;
  upstream?: {
    endpoint: string;
    errorCode?: string;
    responseShape: string;
    service: string;
    status: number;
  };
};

type TokenRequestPayload = {
  userIds: Array<{
    name: string;
    provider: string;
    type: "User";
  }>;
  searchHub?: string;
  pipeline?: string;
  userDisplayName?: string;
};

const originalEnv = { ...process.env };

async function responseBody(response: Response) {
  return (await response.json()) as SearchTokenResponse;
}

function buildRequest(clientIp?: string) {
  return new Request("http://localhost/api/search-token", {
    headers: clientIp ? { "x-forwarded-for": clientIp } : undefined,
  });
}

function clearCoveoEnv() {
  for (const key of Object.keys(process.env)) {
    if (key.startsWith("COVEO_")) {
      delete process.env[key];
    }
  }
}

function setRequiredEnv() {
  process.env.COVEO_AUTH_MODE = "search-token";
  process.env.COVEO_AUTHENTICATED_SEARCH_API_KEY = "authenticated-search-key";
  process.env.COVEO_ORGANIZATION_ID = "example-org";
  process.env.COVEO_PLATFORM_API_KEY = "test-api-key";
}

beforeEach(() => {
  process.env = { ...originalEnv };
  clearCoveoEnv();
});

afterEach(() => {
  process.env = { ...originalEnv };
  vi.unstubAllGlobals();
});

describe("GET /api/search-token", () => {
  it("returns a 429 rate-limit error once the per-IP request limit is exceeded", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);

    const clientIp = "198.51.100.42";

    for (let i = 0; i < 30; i += 1) {
      const response = await GET(buildRequest(clientIp));
      expect(response.status).not.toBe(429);
    }

    const limitedResponse = await GET(buildRequest(clientIp));
    const body = await responseBody(limitedResponse);

    expect(limitedResponse.status).toBe(429);
    expect(body).toEqual({ code: "RATE_LIMITED", error: "Too many token requests." });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns a no-store 500 without calling Coveo when required environment is missing", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(buildRequest());
    const body = await responseBody(response);

    expect(response.status).toBe(500);
    expect(response.headers.get("Cache-Control")).toBe("no-store, max-age=0");
    expect(body.code).toBe("CONFIGURATION_ERROR");
    expect(body.error).toBe("Missing required environment variable: COVEO_AUTH_MODE");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns a typed configuration error when search-token mode is not enabled", async () => {
    process.env.COVEO_AUTH_MODE = "anonymous-api-key";
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(buildRequest());
    const body = await responseBody(response);

    expect(response.status).toBe(400);
    expect(body).toEqual({
      code: "CONFIGURATION_ERROR",
      error: "/api/search-token is only available when COVEO_AUTH_MODE=search-token.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requires a server-only authenticated-search key in search-token mode", async () => {
    setRequiredEnv();
    delete process.env.COVEO_AUTHENTICATED_SEARCH_API_KEY;
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(buildRequest());
    const body = await responseBody(response);

    expect(response.status).toBe(500);
    expect(body.code).toBe("CONFIGURATION_ERROR");
    expect(body.error).toBe("Missing required environment variable: COVEO_AUTHENTICATED_SEARCH_API_KEY");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("mints a token with safe response fields and the expected Coveo payload", async () => {
    setRequiredEnv();
    process.env.COVEO_SEARCH_HUB = "assessment-hub";
    process.env.COVEO_PIPELINE = "assessment-pipeline";
    process.env.COVEO_USER_ID = "visitor@example.test";
    process.env.COVEO_IDENTITY_PROVIDER = "Assessment Provider";
    process.env.COVEO_FACET_FIELDS = " source, ,filetype,author ";

    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ token: "search-token" }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(buildRequest());
    const body = await responseBody(response);

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store, max-age=0");
    expect(body).toEqual({
      token: "search-token",
      organizationId: "example-org",
      searchHub: "assessment-hub",
      pipeline: "assessment-pipeline",
      facetFields: ["source", "filetype", "author"],
    });
    expect(JSON.stringify(body)).not.toContain("test-api-key");
    expect(JSON.stringify(body)).not.toContain("authenticated-search-key");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://example-org.org.coveo.com/rest/search/v2/token?organizationId=example-org",
      expect.objectContaining({
        cache: "no-store",
        method: "POST",
      }),
    );

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const payload = JSON.parse(String(requestInit.body)) as TokenRequestPayload;

    expect(requestInit.headers).toMatchObject({
      Accept: "application/json",
      Authorization: "Bearer authenticated-search-key",
      "Content-Type": "application/json",
    });
    expect(payload).toEqual({
      userIds: [
        {
          name: "visitor@example.test",
          provider: "Assessment Provider",
          type: "User",
        },
      ],
      searchHub: "assessment-hub",
      pipeline: "assessment-pipeline",
      userDisplayName: "Assessment visitor",
    });
  });

  it("returns a controlled 502 when Coveo rejects the token request", async () => {
    setRequiredEnv();

    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ code: "INVALID_API_KEY", message: "redacted by route" }), {
        headers: { "Content-Type": "application/json" },
        status: 401,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(buildRequest());
    const body = await responseBody(response);

    expect(response.status).toBe(502);
    expect(response.headers.get("Cache-Control")).toBe("no-store, max-age=0");
    expect(body).toEqual({
      code: "TOKEN_MINT_FAILED",
      error: "Unable to mint Coveo search token.",
      upstream: {
        endpoint: "search-v2-token",
        errorCode: "INVALID_API_KEY",
        responseShape: "object:code,message",
        service: "search-token",
        status: 401,
      },
    });
    expect(JSON.stringify(body)).not.toContain("redacted by route");
  });

  it("uses an explicit token endpoint override when configured", async () => {
    setRequiredEnv();
    process.env.COVEO_SEARCH_TOKEN_ENDPOINT = "https://token.example.test/rest/search/token";

    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ token: "search-token" }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(buildRequest());
    const body = await responseBody(response);

    expect(response.status).toBe(200);
    expect(body.token).toBe("search-token");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://token.example.test/rest/search/token",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("falls back to the legacy token endpoint when the v2 endpoint is unavailable", async () => {
    setRequiredEnv();

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("not found", { status: 404 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ token: "legacy-search-token" }), {
          headers: { "Content-Type": "application/json" },
          status: 200,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(buildRequest());
    const body = await responseBody(response);

    expect(response.status).toBe(200);
    expect(body.token).toBe("legacy-search-token");
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://example-org.org.coveo.com/rest/search/v2/token?organizationId=example-org",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://example-org.org.coveo.com/rest/search/token?organizationId=example-org",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("returns a controlled 502 when Coveo returns no token", async () => {
    setRequiredEnv();

    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({}), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(buildRequest());
    const body = await responseBody(response);

    expect(response.status).toBe(502);
    expect(response.headers.get("Cache-Control")).toBe("no-store, max-age=0");
    expect(body).toEqual({
      code: "TOKEN_RESPONSE_INVALID",
      error: "Coveo token response did not include a token.",
      upstream: {
        endpoint: "search-v2-token",
        responseShape: "object:",
        service: "search-token",
        status: 200,
      },
    });
  });
});
