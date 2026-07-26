import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import BlogIndexPage from "@/app/blog/page";

function mockCoveoResponse(results: unknown[]) {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify({ results }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    }),
  );
}

describe("BlogIndexPage", () => {
  beforeEach(() => {
    process.env.COVEO_ORGANIZATION_ID = "test-org";
    process.env.COVEO_PLATFORM_API_KEY = "test-key";
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    delete process.env.COVEO_ORGANIZATION_ID;
    delete process.env.COVEO_PLATFORM_API_KEY;
  });

  it("falls back to the default query when ?q= is absent", async () => {
    mockCoveoResponse([]);

    const jsx = await BlogIndexPage({ searchParams: Promise.resolve({}) });
    render(jsx);

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ body: expect.stringContaining('"q":"robotics"') }),
    );
  });

  it("resolves a string ?q= value", async () => {
    mockCoveoResponse([]);

    const jsx = await BlogIndexPage({ searchParams: Promise.resolve({ q: "grippers" }) });
    render(jsx);

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ body: expect.stringContaining('"q":"grippers"') }),
    );
  });

  it("resolves an array ?q= value by taking the first entry", async () => {
    mockCoveoResponse([]);

    const jsx = await BlogIndexPage({ searchParams: Promise.resolve({ q: ["sensors", "arms"] }) });
    render(jsx);

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ body: expect.stringContaining('"q":"sensors"') }),
    );
  });

  it("treats a blank ?q= the same as absent", async () => {
    mockCoveoResponse([]);

    const jsx = await BlogIndexPage({ searchParams: Promise.resolve({ q: "   " }) });
    render(jsx);

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ body: expect.stringContaining('"q":"robotics"') }),
    );
  });
});
