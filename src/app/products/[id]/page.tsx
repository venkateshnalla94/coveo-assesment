import { ProductDetailClient } from "@/components/commerce/ProductDetailClient";
import { fetchProductDetail } from "@/lib/coveo/product-detail";
import { toSearchFeatureFlags } from "@/lib/features/search-feature-flags";
import { resolveRuntimeConfig } from "@/lib/runtime/runtime-config";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  // Server-side lookup by permanentid makes the PDP linkable, refreshable, crawlable, and richer
  // than the Commerce listing payload (specs, availability, reviews, cross-sell). Returns null on
  // a miss/failure so the client falls back to the sessionStorage hand-off or the empty state.
  const serverProduct = (await fetchProductDetail(decodedId)) ?? null;
  const featureFlags = toSearchFeatureFlags(resolveRuntimeConfig().featureFlags);

  return (
    <main className="pdp-page">
      <ProductDetailClient
        analyticsEnabled={featureFlags.enableAnalytics}
        id={decodedId}
        serverProduct={serverProduct}
      />
    </main>
  );
}
