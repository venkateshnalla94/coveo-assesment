import type { MetadataRoute } from "next";

// /products/* has no server-renderable content — the PDP reads sessionStorage handed off by a
// search result click (see src/lib/commerce/product-session-cache.ts), so a crawler visiting one
// directly would only ever see the empty state. Keep it out of the index entirely.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/products/",
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
