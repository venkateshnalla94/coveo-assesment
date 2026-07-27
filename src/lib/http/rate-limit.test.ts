import { describe, expect, it } from "vitest";

import { getClientIp, isRateLimited } from "@/lib/http/rate-limit";

function uniqueKey(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2)}`;
}

describe("isRateLimited", () => {
  it("allows requests under the limit and accumulates timestamps", () => {
    const key = uniqueKey("under-limit");

    expect(isRateLimited(key, 3, 60_000)).toBe(false);
    expect(isRateLimited(key, 3, 60_000)).toBe(false);
    expect(isRateLimited(key, 3, 60_000)).toBe(false);
  });

  it("returns true once the limit is reached and does not record a new timestamp", () => {
    const key = uniqueKey("at-limit");

    expect(isRateLimited(key, 2, 60_000)).toBe(false);
    expect(isRateLimited(key, 2, 60_000)).toBe(false);
    // Third call exceeds the limit of 2.
    expect(isRateLimited(key, 2, 60_000)).toBe(true);
    // Still limited on subsequent calls since no new timestamp was recorded.
    expect(isRateLimited(key, 2, 60_000)).toBe(true);
  });

  it("lets a request through once an old timestamp rolls off the window", async () => {
    const key = uniqueKey("window-roll-off");

    expect(isRateLimited(key, 1, 20)).toBe(false);
    expect(isRateLimited(key, 1, 20)).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(isRateLimited(key, 1, 20)).toBe(false);
  });
});

describe("getClientIp", () => {
  it("parses a single ip from x-forwarded-for", () => {
    const request = new Request("http://localhost/", {
      headers: { "x-forwarded-for": "203.0.113.5" },
    });

    expect(getClientIp(request)).toBe("203.0.113.5");
  });

  it("takes the first ip from a multi-ip x-forwarded-for header", () => {
    const request = new Request("http://localhost/", {
      headers: { "x-forwarded-for": "203.0.113.5, 70.41.3.18, 150.172.238.178" },
    });

    expect(getClientIp(request)).toBe("203.0.113.5");
  });

  it("falls back to local when the header is missing", () => {
    const request = new Request("http://localhost/");

    expect(getClientIp(request)).toBe("local");
  });
});
