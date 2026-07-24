import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  useRouter: () => ({ push: vi.fn() }),
}));

import BlogArticlePage from "@/app/blog/[id]/page";

function mockCoveoResponse(results: unknown[]) {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify({ results }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    }),
  );
}

describe("BlogArticlePage", () => {
  beforeEach(() => {
    process.env.COVEO_ORGANIZATION_ID = "test-org";
    process.env.COVEO_PLATFORM_API_KEY = "test-key";
    mockCoveoResponse([
      {
        clickUri: "https://blog.example.test/robot-arm-maintenance",
        raw: { permanentid: "article-1" },
        title: "Robot Arm Maintenance",
      },
    ]);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    delete process.env.COVEO_ORGANIZATION_ID;
    delete process.env.COVEO_PLATFORM_API_KEY;
  });

  it("passes the resolved ?q= through to Header without altering the article content", async () => {
    const jsx = await BlogArticlePage({
      params: Promise.resolve({ id: "article-1" }),
      searchParams: Promise.resolve({ q: "welding" }),
    });
    render(jsx);

    expect(screen.getByRole("heading", { name: "Robot Arm Maintenance" })).not.toBeNull();
    expect(screen.getByRole("link", { name: "Blog" }).getAttribute("href")).toBe("/blog?q=welding");
  });

  it("leaves nav links unqueried when ?q= is absent, still rendering the article", async () => {
    const jsx = await BlogArticlePage({
      params: Promise.resolve({ id: "article-1" }),
      searchParams: Promise.resolve({}),
    });
    render(jsx);

    expect(screen.getByRole("heading", { name: "Robot Arm Maintenance" })).not.toBeNull();
    expect(screen.getByRole("link", { name: "Blog" }).getAttribute("href")).toBe("/blog");
  });

  it("resolves an array ?q= value by taking the first entry", async () => {
    const jsx = await BlogArticlePage({
      params: Promise.resolve({ id: "article-1" }),
      searchParams: Promise.resolve({ q: ["sensors", "arms"] }),
    });
    render(jsx);

    expect(screen.getByRole("link", { name: "Blog" }).getAttribute("href")).toBe("/blog?q=sensors");
  });
});
