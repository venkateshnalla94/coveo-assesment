"use client";

import Link from "next/link";
import { useEffect, useMemo, useSyncExternalStore } from "react";

import { usePublishPageContext } from "@/components/conversation/AgentContextProvider";
import { ProductDetailView } from "@/components/commerce/ProductDetailView";
import {
  AnalyticsProviderRoot,
  CoveoAnalyticsProvider,
  useAnalytics,
} from "@/features/analytics/analytics";
import type { ProductDetail, ProductResult } from "@/features/commerce/models/commerce-models";
import { readProductForPdp } from "@/lib/commerce/product-session-cache";

function subscribe() {
  // sessionStorage is read once per mount; nothing external re-triggers it, so no-op unsubscribe.
  return () => {};
}

function getServerSnapshot() {
  return undefined;
}

// useSyncExternalStore requires a stable (cached) snapshot reference — readProductForPdp does a
// fresh JSON.parse per call, so cache its result per id or React re-renders forever.
const snapshotCache = new Map<string, ProductResult | undefined>();

function getSnapshot(id: string) {
  if (!snapshotCache.has(id)) {
    snapshotCache.set(id, readProductForPdp(id));
  }
  return snapshotCache.get(id);
}

// Emits the commerce product-view event once per product, through the same app analytics bus the
// rest of the UI uses (CoveoAnalyticsProvider forwards it onto the Coveo Relay Event stream). Kept
// as its own component so it sits inside the AnalyticsProviderRoot and is unit-testable in
// isolation with a stub provider.
export function ProductViewAnalytics({ product }: { product: ProductDetail }) {
  const analytics = useAnalytics();
  const { id, sku, brand, price } = product;

  useEffect(() => {
    analytics.track("product_view", {
      productId: id,
      ...(sku ? { sku } : {}),
      ...(brand ? { brand } : {}),
      ...(price !== undefined ? { price } : {}),
    });
  }, [analytics, id, sku, brand, price]);

  return null;
}

// Server-first PDP. When the server resolved the product by permanentid (linkable, comprehensive
// detail), `serverProduct` is used directly. Otherwise this falls back to the product the result
// card stashed in sessionStorage — which keeps in-session navigation working even if the server
// lookup missed (e.g. an id that isn't a permanentid). Both paths share the empty state below.
export function ProductDetailClient({
  id,
  serverProduct,
  analyticsEnabled = false,
}: {
  id: string;
  serverProduct?: ProductDetail | null;
  analyticsEnabled?: boolean;
}) {
  const cached = useSyncExternalStore(subscribe, () => getSnapshot(id), getServerSnapshot);
  const product: ProductDetail | undefined = serverProduct ?? cached;
  const analyticsProvider = useMemo(() => new CoveoAnalyticsProvider(), []);

  usePublishPageContext(product ? { id: product.id, kind: "product", title: product.title } : undefined);

  if (!product) {
    return (
      <div className="empty-state pdp-empty-state">
        <h2>Product details unavailable</h2>
        <p>Open this product from a product listing to view its details.</p>
        <Link className="secondary-button" href="/catalog">
          Back to catalog
        </Link>
      </div>
    );
  }

  return (
    <AnalyticsProviderRoot enabled={analyticsEnabled} provider={analyticsProvider}>
      <ProductViewAnalytics product={product} />
      <ProductDetailView product={product} />
    </AnalyticsProviderRoot>
  );
}
