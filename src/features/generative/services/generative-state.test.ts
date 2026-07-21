import { describe, expect, it } from "vitest";

import { GenerativeConfigurationError, GenerativeTimeoutError } from "@/features/generative/providers/generative-errors";
import {
  generativeStateReducer,
  getFriendlyGenerativeError,
} from "@/features/generative/services/generative-state";

describe("generativeStateReducer", () => {
  it("models loading, streaming, complete, no-answer, and error states", () => {
    const loading = generativeStateReducer({ status: "idle" }, { type: "requested", query: "q" });
    expect(loading).toEqual({ status: "loading", query: "q" });

    const streaming = generativeStateReducer(loading, {
      type: "streamed",
      query: "q",
      partialAnswer: "partial",
      citations: [],
    });
    expect(streaming.status).toBe("streaming");

    expect(
      generativeStateReducer(streaming, {
        type: "completed",
        answer: { id: "a1", answer: "done", citations: [], query: "q" },
      }),
    ).toMatchObject({ status: "complete" });

    expect(generativeStateReducer(loading, { type: "no-answer", query: "q" })).toEqual({
      status: "no-answer",
      query: "q",
    });
    expect(generativeStateReducer(loading, { type: "failed", query: "q", message: "Nope" })).toEqual(
      { status: "error", query: "q", message: "Nope" },
    );
  });

  it("maps typed provider errors to friendly messages", () => {
    expect(getFriendlyGenerativeError(new GenerativeConfigurationError())).toContain(
      "not configured",
    );
    expect(getFriendlyGenerativeError(new GenerativeTimeoutError())).toContain("too long");
    expect(getFriendlyGenerativeError(new Error("raw"))).toContain("could not be loaded");
  });
});
