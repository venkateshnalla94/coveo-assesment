"use client";

import { Flame, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useAnalytics } from "@/features/analytics/analytics";
import type { TrendingItem } from "@/features/trending/models/trending-models";
import type { TrendingProvider } from "@/features/trending/providers/trending-provider";
import { getSafeTrendingUrl } from "@/features/trending/services/trending-urls";

function formatPublishedAt(publishedAt: string | undefined) {
  if (!publishedAt) {
    return undefined;
  }

  const parsed = new Date(publishedAt);
  return Number.isNaN(parsed.getTime())
    ? undefined
    : new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(parsed);
}

export function TrendingContent({
  description = "Supporting content for product evaluation.",
  enabled,
  provider,
  title = "Trending content",
}: {
  description?: string;
  enabled: boolean;
  provider: TrendingProvider;
  title?: string;
}) {
  const analytics = useAnalytics();
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "success"; items: TrendingItem[] }
    | { status: "empty" }
    | { status: "error" }
  >({ status: "loading" });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const abortController = new AbortController();
    let isCurrent = true;

    provider
      .getTrendingContent({ signal: abortController.signal })
      .then((items) => {
        if (isCurrent) {
          setState(items.length > 0 ? { status: "success", items } : { status: "empty" });
        }
      })
      .catch((error: unknown) => {
        if (isCurrent && !(error instanceof DOMException && error.name === "AbortError")) {
          setState({ status: "error" });
        }
      });

    return () => {
      isCurrent = false;
      abortController.abort();
    };
  }, [enabled, provider]);

  if (!enabled) {
    return null;
  }

  return (
    <section className="insight-card" aria-label={title}>
      <div className="insight-card-title">
        <Flame aria-hidden="true" size={18} />
        <h2>{title}</h2>
      </div>
      <p className="muted-copy">{description}</p>
      {state.status === "loading" ? (
        <div className="trending-skeleton" role="status" aria-live="polite">
          <span>Loading trending content.</span>
          <div />
          <div />
          <div />
        </div>
      ) : null}
      {state.status === "empty" ? <p>No trending content is available.</p> : null}
      {state.status === "error" ? <p>Trending content could not be loaded.</p> : null}
      {state.status === "success" ? (
        <ol className="trending-list">
          {state.items.map((item) => {
            const isValid = getSafeTrendingUrl(item) !== "#";
            const publishedLabel = formatPublishedAt(item.publishedAt);
            const byline = [item.author, publishedLabel].filter(Boolean).join(" · ");

            return (
              <li key={item.id}>
                <span className="trending-rank">{item.rank}</span>
                <div className="trending-item-body">
                  <div className="trending-item-head">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt="" className="trending-thumbnail" src={item.imageUrl} />
                    ) : null}
                    <div className="trending-item-heading">
                      {isValid ? (
                        <Link
                          href={`/blog/${encodeURIComponent(item.id)}`}
                          onClick={() =>
                            analytics.track("trending_content_clicked", {
                              itemId: item.id,
                              rank: item.rank,
                              reason: item.reason,
                              type: item.type,
                            })
                          }
                        >
                          {item.title}
                        </Link>
                      ) : (
                        <span>{item.title}</span>
                      )}
                      <small>
                        {item.category ?? item.type ?? "content"}
                        {item.viewCount ? ` / ${item.viewCount.toLocaleString()} fixture views` : ""}
                        {item.timeWindow ? ` / ${item.timeWindow}` : ""}
                      </small>
                      {byline ? <small className="trending-byline">{byline}</small> : null}
                    </div>
                  </div>
                  {item.reason ? <p className="trending-item-reason">{item.reason}</p> : null}
                  {item.tags && item.tags.length > 0 ? (
                    <ul className="trending-tags">
                      {item.tags.slice(0, 3).map((tag) => (
                        <li key={tag}>{tag}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                {item.trendPercentage ? (
                  <span className="trend-pill">
                    <TrendingUp aria-hidden="true" size={14} />
                    {item.trendPercentage}%
                  </span>
                ) : null}
              </li>
            );
          })}
        </ol>
      ) : null}
    </section>
  );
}
