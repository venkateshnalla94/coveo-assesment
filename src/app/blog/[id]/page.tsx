import { notFound } from "next/navigation";

import { BlogArticleActions } from "@/components/content/BlogArticleActions";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { fetchTrendingArticle } from "@/lib/coveo/content-search";

export const dynamic = "force-dynamic";

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

export default async function BlogArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await fetchTrendingArticle(decodeURIComponent(id)).catch(() => undefined);

  if (!item) {
    notFound();
  }

  const publishedLabel = formatPublishedAt(item.publishedAt);
  const readTimeLabel = estimateReadTime(item.wordCount);

  return (
    <div className="search-app">
      <Header />
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

          {item.tags && item.tags.length > 0 ? (
            <ul className="blog-tags">
              {item.tags.slice(0, 6).map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          ) : null}

          <BlogArticleActions item={item} />
        </article>
      </main>
      <Footer />
    </div>
  );
}
