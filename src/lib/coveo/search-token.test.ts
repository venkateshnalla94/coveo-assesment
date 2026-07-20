import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchSearchTokenConfig, type SearchTokenConfig } from "./search-token";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchSearchTokenConfig", () => {
  it("fetches the local token route without caching and returns the parsed config", async () => {
    const config: SearchTokenConfig = {
      token: "search-token",
      organizationId: "example-org",
      searchHub: "assessment-hub",
      pipeline: "assessment-pipeline",
      facetFields: ["source", "filetype"],
    };
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(config), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchSearchTokenConfig()).resolves.toEqual(config);
    expect(fetchMock).toHaveBeenCalledWith("/api/search-token", { cache: "no-store" });
  });

  it("throws the server-provided error message for failed token initialization", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ error: "Search token route is not configured." }), {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchSearchTokenConfig()).rejects.toThrow("Search token route is not configured.");
  });

  it("uses the generic initialization message when the failure body is not JSON", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response("bad gateway", { status: 502 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchSearchTokenConfig()).rejects.toThrow("Unable to initialize Coveo search.");
  });
});
