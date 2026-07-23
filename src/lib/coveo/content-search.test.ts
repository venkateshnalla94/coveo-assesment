import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CoveoContentRequestError, fetchTrendingArticle, searchTrendingContent } from "@/lib/coveo/content-search";

function mockCoveoResponse(results: unknown[]) {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify({ results }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    }),
  );
}

describe("content-search", () => {
  beforeEach(() => {
    process.env.COVEO_ORGANIZATION_ID = "test-org";
    process.env.COVEO_PLATFORM_API_KEY = "test-key";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.COVEO_ORGANIZATION_ID;
    delete process.env.COVEO_PLATFORM_API_KEY;
  });

  it("maps enriched metadata and prefers raw.permanentid as the id, without a body", async () => {
    mockCoveoResponse([
      {
        clickUri: "https://blog.example.test/robot-arm-maintenance",
        excerpt: "First sentence about robot arms. Second sentence that should be cut off.",
        raw: {
          author: "Dr. Alistair Finch",
          category: "Maintenance Tips",
          date: 1700000000000,
          featured_image_url: "https://images.example.test/hero.jpg",
          permanentid: "abc123hash",
          tags: "robotics;maintenance;safety",
          word_count: 935,
        },
        title: "Robot Arm Maintenance",
        uniqueId: "42.5$https://blog.example.test/robot-arm-maintenance",
      },
    ]);

    const items = await searchTrendingContent("robot arm", 1);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      author: "Dr. Alistair Finch",
      category: "Maintenance Tips",
      id: "abc123hash",
      imageUrl: "https://images.example.test/hero.jpg",
      publishedAt: new Date(1700000000000).toISOString(),
      reason: "First sentence about robot arms....",
      tags: ["robotics", "maintenance", "safety"],
      wordCount: 935,
    });
    expect(items[0].body).toBeUndefined();
  });

  it("includes a sanitized body and forces safe link attributes for a single article fetch", async () => {
    mockCoveoResponse([
      {
        clickUri: "https://blog.example.test/robot-arm-maintenance",
        raw: {
          content:
            '<p>Safe paragraph <a href="https://example.test">link</a>.</p><script>alert(1)</script>',
          permanentid: "abc123hash",
        },
        title: "Robot Arm Maintenance",
      },
    ]);

    const article = await fetchTrendingArticle("abc123hash");

    expect(article?.body).toContain("<p>Safe paragraph");
    expect(article?.body).toContain('target="_blank"');
    expect(article?.body).toContain('rel="noopener noreferrer"');
    expect(article?.body).not.toContain("<script>");
  });

  it("returns undefined when no article matches the id", async () => {
    mockCoveoResponse([]);

    await expect(fetchTrendingArticle("missing-id")).resolves.toBeUndefined();
  });

  it("throws a CoveoContentRequestError when the upstream request fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 502 }));

    await expect(searchTrendingContent("robot arm", 1)).rejects.toThrow(CoveoContentRequestError);
  });
});
