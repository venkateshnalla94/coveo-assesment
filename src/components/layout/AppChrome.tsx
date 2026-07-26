"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { Header } from "@/components/layout/Header";
import { useHeaderSearchOverride } from "@/components/layout/header-search-context";
import type { HeadlessCommerceAuthConfig } from "@/features/commerce/headless/commerce-auth";

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

  return (
    <Header
      activePath={deriveActivePath(pathname)}
      authConfig={authConfig}
      currentQuery={currentQuery}
      search={override}
    />
  );
}
