import { describe, expect, it } from "vitest";

import { getSafeCitationUrl } from "@/features/generative/services/citations";

describe("getSafeCitationUrl", () => {
  it("allows http urls and rejects unsafe or malformed urls", () => {
    expect(getSafeCitationUrl({ url: "https://example.test/path" })).toBe(
      "https://example.test/path",
    );
    expect(getSafeCitationUrl({ url: "javascript:alert(1)" })).toBe("#");
    expect(getSafeCitationUrl({ url: "not a url" })).toBe("#");
  });
});
