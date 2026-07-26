"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useSyncExternalStore } from "react";

import { Header } from "@/components/layout/Header";
import { useHeaderSearchOverride } from "@/components/layout/header-search-context";
import type { HeadlessCommerceAuthConfig } from "@/features/commerce/headless/commerce-auth";

function noopSubscribe() {
  return () => {};
}

function getIsClientSnapshot() {
  return true;
}

function getIsServerSnapshot() {
  return false;
}

/**
 * True only once past hydration. `usePublishHeaderSearch` can publish an override the instant its
 * owning page mounts — potentially before React has finished settling this component's own first
 * hydration pass. Gating the override on this guarantees the first client render always matches
 * SSR (neither has an override yet) regardless of that timing race.
 */
function useHasHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, getIsClientSnapshot, getIsServerSnapshot);
}

export function deriveActivePath(pathname: string): string {
  if (pathname.startsWith("/blog")) {
    return "/blog";
  }

  if (pathname.startsWith("/catalog") || pathname.startsWith("/products")) {
    return "/catalog";
  }

  return "/";
}

export function AppChrome({ authConfig }: { authConfig: HeadlessCommerceAuthConfig }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const override = useHeaderSearchOverride();
  const currentQuery = searchParams.get("q")?.trim() || undefined;
  const hasHydrated = useHasHydrated();

  return (
    <Header
      activePath={deriveActivePath(pathname)}
      authConfig={authConfig}
      currentQuery={currentQuery}
      search={hasHydrated ? override : undefined}
    />
  );
}
