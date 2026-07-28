import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { BlogArticleActions } from "@/components/content/BlogArticleActions";
import { CoveoContentRequestError, fetchTrendingArticle } from "@/lib/coveo/content-search";
import { BLOG_REVALIDATE_SECONDS } from "@/lib/coveo/blog-index-query";
import type { TrendingItem } from "@/features/trending/models/trending-models";

// Next's route-segment config must be a literal, not an import — keep in sync with
// BLOG_REVALIDATE_SECONDS below, which the fetch call uses.
export const revalidate = 300;

type ArticleLoadResult =
  | { status: "found"; item: TrendingItem }
  | { status: "not-found" }
  | { status: "error" };

// generateMetadata and the page body both need this article; React's cache() dedupes the
// upstream fetch to one call per request instead of two.
const loadArticle = cache(async (id: string): Promise<ArticleLoadResult> => {
  try {
    const item = await fetchTrendingArticle(id, BLOG_REVALIDATE_SECONDS);
    return item ? { status: "found", item } : { status: "not-found" };
  } catch (error) {
    if (error instanceof CoveoContentRequestError) {
      return { status: "error" };
    }
    throw error;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await loadArticle(decodeURIComponent(id));

  if (result.status !== "found") {
    return { title: "Article not found | RoboMotion Industries" };
  }

  return {
    title: `${result.item.title} | RoboMotion Industries`,
    description: [result.item.category, result.item.author].filter(Boolean).join(" · ") || result.item.title,
  };
}

function formatPublishedAt(publishedAt: string | undefined) {
  if (!publishedAt) {
    return undefined;
  }

  const parsed = new Date(publishedAt);
  return Number.isNaN(parsed.getTime())
    ? undefined
    : new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(parsed);
}

function estimateReadTime(wordCount: number | undefined) {
  if (!wordCount) {
    return undefined;
  }

  const minutes = Math.max(1, Math.round(wordCount / 200));
  return `${minutes} min read`;
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await loadArticle(decodeURIComponent(id));

  if (result.status === "not-found") {
    notFound();
  }

  if (result.status === "error") {
    return (
      <main className="blog-page">
        <p className="blog-body-fallback">Blog article could not be loaded.</p>
      </main>
    );
  }

  const { item } = result;
  const publishedLabel = formatPublishedAt(item.publishedAt);
  const readTimeLabel = estimateReadTime(item.wordCount);

  return (
    <>
      <main className="blog-page">
        <article className="blog-article">
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" className="blog-hero-image" src={item.imageUrl} />
          ) : null}

          <div className="blog-article-header">
            {item.category ? <span className="category-pill">{item.category}</span> : null}
            <h1>{item.title}</h1>
            <p className="blog-byline">
              {[item.author, publishedLabel, readTimeLabel].filter(Boolean).join(" · ")}
            </p>
          </div>

          {item.body ? (
            <div className="blog-body" dangerouslySetInnerHTML={{ __html: item.body }} />
          ) : (
            <p className="blog-body-fallback">{item.reason ?? "Full article content is not available."}</p>
          )}

          {item.images && item.images.length > 0 ? (
            <ul className="blog-image-strip">
              {item.images.map((imageSrc) => (
                <li key={imageSrc}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="" src={imageSrc} />
                </li>
              ))}
            </ul>
          ) : null}

          {item.tags && item.tags.length > 0 ? (
            <div className="blog-tags-section">
              <span className="blog-tags-label">Tags</span>
              <ul className="blog-tags">
                {item.tags.slice(0, 6).map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <BlogArticleActions item={item} />
        </article>
      </main>
    </>
  );
}
