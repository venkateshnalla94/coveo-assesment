import type { MetadataRoute } from "next";

import { BLOG_INDEX_QUERY, BLOG_INDEX_RESULT_COUNT } from "@/lib/coveo/blog-index-query";
import { searchTrendingContent } from "@/lib/coveo/content-search";

// Same revalidation window as /blog and /blog/[id] — keeps the sitemap from
// calling Coveo on every crawler hit.
export const revalidate = 300;

// /products/* is intentionally excluded — see robots.ts for why.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily" },
    { url: `${base}/catalog`, changeFrequency: "daily" },
    { url: `${base}/blog`, changeFrequency: "daily" },
  ];

  const articles = await searchTrendingContent(BLOG_INDEX_QUERY, BLOG_INDEX_RESULT_COUNT, revalidate).catch(() => []);
  const articleRoutes: MetadataRoute.Sitemap = articles.map((item) => ({
    url: `${base}/blog/${encodeURIComponent(item.id)}`,
    changeFrequency: "weekly",
  }));

  return [...staticRoutes, ...articleRoutes];
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
