import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ProductDiscoveryExperience } from "@/components/commerce/ProductDiscoveryExperience";
import type { HeadlessCommerceAuthConfig } from "@/features/commerce/headless/commerce-auth";
import { toSearchFeatureFlags } from "@/lib/features/search-feature-flags";
import {
  resolveRuntimeConfig,
  type RuntimeConfig,
} from "@/lib/runtime/runtime-config";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const runtimeConfig = resolveRuntimeConfig({ searchParams: await searchParams });
  const featureFlags = {
    ...toSearchFeatureFlags(runtimeConfig.featureFlags),
    enableSampleSearchResponse: false,
  };
  const commerceAuthConfig = resolveHeadlessCommerceAuthConfig(runtimeConfig);

  return (
    <div className="search-app">
      <Header />
      <ProductDiscoveryExperience
        commerceAuthConfig={commerceAuthConfig}
        featureFlags={featureFlags}
      />
      <Footer />
    </div>
  );
}

function resolveHeadlessCommerceAuthConfig(
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
