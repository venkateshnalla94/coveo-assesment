"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import { ProductDetailView } from "@/components/commerce/ProductDetailView";
import type { ProductResult } from "@/features/commerce/models/commerce-models";
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

// Commerce products only exist in the browser's search-result state (see CLAUDE.md: no
// product-detail API route), so this reads the product the result card stashed in
// sessionStorage instead of fetching it. Direct visits / expired tabs fall back below.
export function ProductDetailClient({ id }: { id: string }) {
  const product = useSyncExternalStore(subscribe, () => getSnapshot(id), getServerSnapshot);

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

  return <ProductDetailView product={product} />;
}
