import Link from "next/link";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { resolveHeadlessCommerceAuthConfig } from "@/features/commerce/headless/commerce-auth-resolver";
import {
  CoveoContentRequestError,
  searchTrendingContent,
} from "@/lib/coveo/content-search";
import { resolveRuntimeConfig } from "@/lib/runtime/runtime-config";
import type { TrendingItem } from "@/features/trending/models/trending-models";

export const dynamic = "force-dynamic";

const BLOG_INDEX_QUERY = "robotics";
const BLOG_INDEX_RESULT_COUNT = 12;

function formatPublishedAt(publishedAt: string | undefined) {
  if (!publishedAt) {
    return undefined;
  }

  const parsed = new Date(publishedAt);
  return Number.isNaN(parsed.getTime())
    ? undefined
    : new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(parsed);
}

async function loadBlogIndex(): Promise<
  | { status: "success"; items: TrendingItem[] }
  | { status: "empty" }
  | { status: "error" }
> {
  try {
    const items = await searchTrendingContent(
      BLOG_INDEX_QUERY,
      BLOG_INDEX_RESULT_COUNT,
    );
    return items.length > 0
      ? { status: "success", items }
      : { status: "empty" };
  } catch (error) {
    if (error instanceof CoveoContentRequestError) {
      return { status: "error" };
    }
    throw error;
  }
}

export default async function BlogIndexPage() {
  const state = await loadBlogIndex();
  const runtimeConfig = resolveRuntimeConfig();
  const commerceAuthConfig = resolveHeadlessCommerceAuthConfig(runtimeConfig);

  return (
    <div className="search-app">
      <Header activePath="/blog" authConfig={commerceAuthConfig} />
      <main className="blog-index">
        <div className="blog-index-header">
          <h1>Blogs</h1>
          <p className="muted-copy">
            Technical resources and product updates for industrial robotics.
          </p>
        </div>

        {state.status === "empty" ? (
          <p>No articles are available right now.</p>
        ) : null}
        {state.status === "error" ? (
          <p>Blog articles could not be loaded.</p>
        ) : null}

        {state.status === "success" ? (
          <ul className="blog-index-grid">
            {state.items.map((item) => {
              const publishedLabel = formatPublishedAt(item.publishedAt);
              const byline = [item.author, publishedLabel]
                .filter(Boolean)
                .join(" · ");

              return (
                <li key={item.id}>
                  <Link
                    className="blog-index-card"
                    href={`/blog/${encodeURIComponent(item.id)}`}
                  >
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt=""
                        className="blog-index-thumbnail"
                        src={item.imageUrl}
                      />
                    ) : null}
                    <div className="blog-index-card-body">
                      {item.category ? (
                        <span className="category-pill">{item.category}</span>
                      ) : null}
                      <h2>{item.title}</h2>
                      {byline ? <p className="blog-byline">{byline}</p> : null}
                      {item.reason ? (
                        <p className="blog-index-reason">{item.reason}</p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
