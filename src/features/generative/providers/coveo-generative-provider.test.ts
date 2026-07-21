import { afterEach, describe, expect, it, vi } from "vitest";

import { CoveoGenerativeProvider } from "@/features/generative/providers/coveo-generative-provider";

describe("CoveoGenerativeProvider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads generated answers through the internal server route", async () => {
    const answer = {
      answer: "Use technical resources to evaluate compatibility.",
      citations: [],
      id: "answer-1",
      query: "welding arm",
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ answer }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }),
    );

    await expect(new CoveoGenerativeProvider().generate("welding arm")).resolves.toEqual(answer);
    expect(fetch).toHaveBeenCalledWith(
      "/api/coveo/generative/answer",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("throws a provider error when the server route fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 502 }));

    await expect(new CoveoGenerativeProvider().generate("welding arm")).rejects.toThrow(
      "Live Coveo generative answer request failed",
    );
  });

  it("returns null when the server route has no generated answer", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ answer: null }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }),
    );

    await expect(new CoveoGenerativeProvider().generate("welding arm")).resolves.toBeNull();
  });

  it("returns null when the server route returns malformed JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("not-json", {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }),
    );

    await expect(new CoveoGenerativeProvider().generate("welding arm")).resolves.toBeNull();
  });
});
