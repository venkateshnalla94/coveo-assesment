import { ProductDiscoveryExperience } from "@/components/commerce/ProductDiscoveryExperience";
import { SEARCH_UI } from "@/components/search/search-ui.constants";
import { resolveHeadlessCommerceAuthConfig } from "@/features/commerce/headless/commerce-auth-resolver";
import { toSearchFeatureFlags } from "@/lib/features/search-feature-flags";
import { resolveRuntimeConfig } from "@/lib/runtime/runtime-config";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const runtimeConfig = resolveRuntimeConfig();
  const featureFlags = toSearchFeatureFlags(runtimeConfig.featureFlags);
  const commerceAuthConfig = resolveHeadlessCommerceAuthConfig(runtimeConfig);
  const initialQuery = resolveInitialCatalogQuery(resolvedSearchParams?.q);

  return (
    <ProductDiscoveryExperience
      commerceAuthConfig={commerceAuthConfig}
      featureFlags={featureFlags}
      initialQuery={initialQuery}
    />
  );
}

function resolveInitialCatalogQuery(query: string | string[] | undefined) {
  const value = Array.isArray(query) ? query[0] : query;
  const trimmedValue = value?.trim();

  return trimmedValue ? trimmedValue : SEARCH_UI.defaultQuery;
}
