import { ProductDetailClient } from "@/components/commerce/ProductDetailClient";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="pdp-page">
      <ProductDetailClient id={decodeURIComponent(id)} />
    </main>
  );
}
