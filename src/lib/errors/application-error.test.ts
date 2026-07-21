import { describe, expect, it } from "vitest";

import { GenerativeConfigurationError, GenerativeProviderError, GenerativeTimeoutError } from "@/features/generative/providers/generative-errors";

import { ConfigurationError, sanitizeMetadata, toApplicationError } from "./application-error";

describe("application error mapping", () => {
  it("maps configuration errors without exposing secret metadata", () => {
    const error = toApplicationError(
      new ConfigurationError("Missing config", {
        authorization: "Bearer token",
        organizationId: "org",
      }),
    );

    expect(error.code).toBe("CONFIGURATION");
    expect(error.userMessage).toBe("This feature is not configured for the current environment.");
    expect(error.metadata).toEqual({ organizationId: "org" });
  });

  it("maps provider, timeout, and unknown errors", () => {
    expect(toApplicationError(new GenerativeProviderError()).code).toBe("PROVIDER");
    expect(toApplicationError(new GenerativeTimeoutError()).code).toBe("TIMEOUT");
    expect(toApplicationError(new Error("unexpected")).code).toBe("UNKNOWN");
    expect(toApplicationError("bad").code).toBe("UNKNOWN");
  });

  it("maps existing generative configuration errors", () => {
    expect(toApplicationError(new GenerativeConfigurationError()).code).toBe("CONFIGURATION");
  });

  it("redacts unsafe metadata values", () => {
    expect(sanitizeMetadata({ apiKey: "secret", safe: "value", tokenValue: "x" })).toEqual({
      safe: "value",
    });
  });
});
