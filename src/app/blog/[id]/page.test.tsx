import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  usePathname: () => "/blog/test-article",
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

  it("renders the article", async () => {
    const jsx = await BlogArticlePage({
      params: Promise.resolve({ id: "article-1" }),
    });
    render(jsx);

    expect(screen.getByRole("heading", { name: "Robot Arm Maintenance" })).not.toBeNull();
  });

  it("renders an error state instead of a 404 when Coveo env vars are missing", async () => {
    delete process.env.COVEO_ORGANIZATION_ID;
    delete process.env.COVEO_PLATFORM_API_KEY;

    const jsx = await BlogArticlePage({
      params: Promise.resolve({ id: "article-1" }),
    });
    const { container } = render(jsx);

    expect(container.textContent).toContain("Blog article could not be loaded.");
  });
});
