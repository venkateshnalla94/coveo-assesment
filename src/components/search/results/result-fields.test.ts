import { describe, expect, it } from "vitest";

import { getMeta, getRawString, getThumbnail } from "./result-fields";

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
});
