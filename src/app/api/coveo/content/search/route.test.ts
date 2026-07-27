import { afterEach, describe, expect, it, vi } from "vitest";

import { CoveoContentRequestError } from "@/lib/coveo/content-search";

const searchTrendingContentMock = vi.fn();

vi.mock("@/lib/coveo/content-search", async () => {
  const actual = await vi.importActual<typeof import("@/lib/coveo/content-search")>(
    "@/lib/coveo/content-search",
  );
  return {
    ...actual,
    searchTrendingContent: (...args: unknown[]) => searchTrendingContentMock(...args),
  };
});

import { POST } from "./route";

function jsonRequest(body: unknown, clientIp?: string) {
  return new Request("http://localhost/api/coveo/content/search", {
    body: JSON.stringify(body),
    headers: clientIp ? { "x-forwarded-for": clientIp } : undefined,
    method: "POST",
  });
}

afterEach(() => {
  searchTrendingContentMock.mockReset();
});

describe("POST /api/coveo/content/search", () => {
  it("returns a 429 rate-limit error once the per-IP request limit is exceeded", async () => {
    searchTrendingContentMock.mockResolvedValue([]);
    const clientIp = "198.51.100.42";

    for (let i = 0; i < 20; i += 1) {
      const response = await POST(jsonRequest({ query: "robotics" }, clientIp));
      expect(response.status).not.toBe(429);
    }

    searchTrendingContentMock.mockClear();
    const limitedResponse = await POST(jsonRequest({ query: "robotics" }, clientIp));
    const body = (await limitedResponse.json()) as { error?: string };

    expect(limitedResponse.status).toBe(429);
    expect(body).toEqual({ error: "Too many requests." });
    expect(limitedResponse.headers.get("Cache-Control")).toBe("no-store, max-age=0");
    expect(searchTrendingContentMock).not.toHaveBeenCalled();
  });

  it("defaults the query and result count when the body is missing or malformed", async () => {
    searchTrendingContentMock.mockResolvedValue([]);

    await POST(jsonRequest({}, "203.0.113.1"));

    expect(searchTrendingContentMock).toHaveBeenCalledWith("robotics", 4);
  });

  it("falls back to defaults when request.json() rejects (e.g. an empty or invalid body)", async () => {
    searchTrendingContentMock.mockResolvedValue([]);
    const request = new Request("http://localhost/api/coveo/content/search", {
      headers: { "x-forwarded-for": "203.0.113.2" },
      method: "POST",
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(searchTrendingContentMock).toHaveBeenCalledWith("robotics", 4);
  });

  it("trims the query and clamps numberOfResults into [1, 8]", async () => {
    searchTrendingContentMock.mockResolvedValue([]);

    await POST(jsonRequest({ numberOfResults: 50, query: "  welding arm  " }, "203.0.113.3"));
    expect(searchTrendingContentMock).toHaveBeenLastCalledWith("welding arm", 8);

    await POST(jsonRequest({ numberOfResults: -3, query: "gripper" }, "203.0.113.4"));
    expect(searchTrendingContentMock).toHaveBeenLastCalledWith("gripper", 1);

    await POST(jsonRequest({ numberOfResults: 2.9, query: "arm" }, "203.0.113.5"));
    expect(searchTrendingContentMock).toHaveBeenLastCalledWith("arm", 2);
  });

  it("ignores a blank query and falls back to the default", async () => {
    searchTrendingContentMock.mockResolvedValue([]);

    await POST(jsonRequest({ query: "   " }, "203.0.113.6"));

    expect(searchTrendingContentMock).toHaveBeenCalledWith("robotics", 4);
  });

  it("returns the mapped items on success with no-store headers", async () => {
    const items = [{ id: "1", rank: 1, timeWindow: "Coveo Search API", title: "Robot Arm", type: "article", url: "https://example.test" }];
    searchTrendingContentMock.mockResolvedValue(items);

    const response = await POST(jsonRequest({ query: "robotics" }, "203.0.113.7"));
    const body = (await response.json()) as { items: unknown };

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store, max-age=0");
    expect(body).toEqual({ items });
  });

  it("returns a 502 when the upstream Coveo request fails", async () => {
    searchTrendingContentMock.mockRejectedValue(new CoveoContentRequestError("upstream failure"));

    const response = await POST(jsonRequest({ query: "robotics" }, "203.0.113.8"));
    const body = (await response.json()) as { error?: string };

    expect(response.status).toBe(502);
    expect(body.error).toBe("Technical resources could not be loaded.");
  });

  it("returns a 504 when the upstream Coveo request times out", async () => {
    const timeoutError = new Error("timed out");
    timeoutError.name = "TimeoutError";
    searchTrendingContentMock.mockRejectedValue(timeoutError);

    const response = await POST(jsonRequest({ query: "robotics" }, "203.0.113.9"));
    const body = (await response.json()) as { error?: string };

    expect(response.status).toBe(504);
    expect(body.error).toBe("Technical resources timed out.");
  });

  it("returns a controlled 500 for any other failure without leaking details", async () => {
    searchTrendingContentMock.mockRejectedValue(new Error("COVEO_ORGANIZATION_ID is not set"));

    const response = await POST(jsonRequest({ query: "robotics" }, "203.0.113.10"));
    const body = (await response.json()) as { error?: string };

    expect(response.status).toBe(500);
    expect(body.error).toBe("Technical resources are not configured.");
  });
});
