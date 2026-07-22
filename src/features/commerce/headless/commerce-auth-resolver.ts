import type { HeadlessCommerceAuthConfig } from "@/features/commerce/headless/commerce-auth";
import type { RuntimeConfig } from "@/lib/runtime/runtime-config";

export function resolveHeadlessCommerceAuthConfig(
  runtimeConfig: RuntimeConfig,
): HeadlessCommerceAuthConfig {
  if (!runtimeConfig.coveo.authMode) {
    return {
      message:
        "COVEO_AUTH_MODE must explicitly be set to anonymous-api-key or search-token.",
      mode: "configuration-error",
    };
  }

  if (runtimeConfig.coveo.authMode === "search-token") {
    return { mode: "search-token" };
  }

  const organizationId = runtimeConfig.coveo.organizationId;
  const anonymousSearchApiKey =
    process.env.NEXT_PUBLIC_COVEO_ANONYMOUS_SEARCH_API_KEY?.trim();

  if (!organizationId) {
    return {
      message: "COVEO_ORGANIZATION_ID is required for anonymous-api-key mode.",
      mode: "configuration-error",
    };
  }

  if (!anonymousSearchApiKey) {
    return {
      message:
        "NEXT_PUBLIC_COVEO_ANONYMOUS_SEARCH_API_KEY is required for anonymous-api-key mode.",
      mode: "configuration-error",
    };
  }

  return {
    accessToken: anonymousSearchApiKey,
    mode: "anonymous-api-key",
    organizationId,
  };
}
