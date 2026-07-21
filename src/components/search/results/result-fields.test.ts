import { describe, expect, it } from "vitest";

import {
  getMeta,
  getRawString,
  getResultDateLabel,
  getResultTags,
  getResultTypeLabel,
  getThumbnail,
} from "./result-fields";

type RawResult = Parameters<typeof getRawString>[0];

function resultWithRaw(raw: Record<string, unknown>): RawResult {
  return { raw };
}

describe("result field helpers", () => {
  it("returns the first non-empty string from the requested raw fields", () => {
    expect(
      getRawString(
        resultWithRaw({
          source: "   ",
          filetype: "PDF",
          documenttype: "Article",
        }),
        ["source", "filetype", "documenttype"],
      ),
    ).toBe("PDF");
  });

  it("supports string arrays while ignoring unsupported raw value types", () => {
    expect(
      getRawString(
        resultWithRaw({ source: 123, filetype: ["HTML"], documenttype: true }),
        ["source", "filetype", "documenttype"],
      ),
    ).toBe("HTML");
  });

  it("prefers the same thumbnail field order used by result rendering", () => {
    expect(
      getThumbnail(
        resultWithRaw({
          thumbnail: "https://cdn.example.test/fallback.png",
          thumbnailuri: "https://cdn.example.test/primary.png",
        }),
      ),
    ).toBe("https://cdn.example.test/primary.png");
  });

  it("builds display metadata from source, type, and author fields only when present", () => {
    expect(
      getMeta(
        resultWithRaw({
          source: "Knowledge Base",
          documenttype: "Article",
          author: "",
          language: "en",
        }),
      ),
    ).toEqual(["Knowledge Base", "Article"]);
  });

  it("normalizes known result type labels while preserving unknown types", () => {
    expect(getResultTypeLabel(resultWithRaw({ filetype: "pdf" }))).toBe("PDF");
    expect(getResultTypeLabel(resultWithRaw({ documenttype: "customDocument" }))).toBe(
      "customDocument",
    );
    expect(getResultTypeLabel(resultWithRaw({}))).toBe("Content");
  });

  it("formats parseable dates and preserves unparseable date values", () => {
    expect(getResultDateLabel(resultWithRaw({ date: "2026-07-18T10:00:00Z" }))).toBe(
      "Jul 18, 2026",
    );
    expect(getResultDateLabel(resultWithRaw({ modifieddate: "recently" }))).toBe("recently");
    expect(getResultDateLabel(resultWithRaw({}))).toBeUndefined();
  });

  it("limits result tags to the displayable source, language, and author fields", () => {
    expect(
      getResultTags(
        resultWithRaw({
          author: "Search Team",
          language: "en",
          source: "Knowledge Base",
          topic: "ignored",
        }),
      ),
    ).toEqual(["Knowledge Base", "en", "Search Team"]);
  });
});
