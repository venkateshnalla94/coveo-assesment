import { ProductDetailClient } from "@/components/commerce/ProductDetailClient";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { resolveHeadlessCommerceAuthConfig } from "@/features/commerce/headless/commerce-auth-resolver";
import { resolveRuntimeConfig } from "@/lib/runtime/runtime-config";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const runtimeConfig = resolveRuntimeConfig();
  const commerceAuthConfig = resolveHeadlessCommerceAuthConfig(runtimeConfig);
  const resolvedSearchParams = await searchParams;
  const currentQueryParam = resolvedSearchParams?.q;
  const currentQuery = (Array.isArray(currentQueryParam) ? currentQueryParam[0] : currentQueryParam)?.trim() || undefined;

  return (
    <div className="search-app">
      <Header activePath="/catalog" authConfig={commerceAuthConfig} currentQuery={currentQuery} />
      <main className="pdp-page">
        <ProductDetailClient id={decodeURIComponent(id)} />
      </main>
      <Footer />
    </div>
  );
}
