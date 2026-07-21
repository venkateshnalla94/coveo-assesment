"use client";

import { Flame, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

import { useAnalytics } from "@/features/analytics/analytics";
import type { TrendingItem } from "@/features/trending/models/trending-models";
import type { TrendingProvider } from "@/features/trending/providers/trending-provider";
import { getSafeTrendingUrl } from "@/features/trending/services/trending-urls";

export function TrendingContent({
  enabled,
  provider,
}: {
  enabled: boolean;
  provider: TrendingProvider;
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

    let isCurrent = true;

    provider
      .getTrendingContent()
      .then((items) => {
        if (isCurrent) {
          setState(items.length > 0 ? { status: "success", items } : { status: "empty" });
        }
      })
      .catch(() => {
        if (isCurrent) {
          setState({ status: "error" });
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [enabled, provider]);

  if (!enabled) {
    return null;
  }

  return (
    <section className="insight-card" aria-label="Trending content">
      <div className="insight-card-title">
        <Flame aria-hidden="true" size={18} />
        <h2>Trending content</h2>
      </div>
      <p className="muted-copy">Fixture metrics for sample-mode demonstration.</p>
      {state.status === "loading" ? (
        <p role="status" aria-live="polite">
          Loading trending content.
        </p>
      ) : null}
      {state.status === "empty" ? <p>No trending content is available.</p> : null}
      {state.status === "error" ? <p>Trending content could not be loaded.</p> : null}
      {state.status === "success" ? (
        <ol className="trending-list">
          {state.items.map((item) => {
            const href = getSafeTrendingUrl(item);
            const isValid = href !== "#";

            return (
              <li key={item.id}>
                <span className="trending-rank">{item.rank}</span>
                <div>
                  {isValid ? (
                    <a
                      href={href}
                      onClick={() =>
                        analytics.track("trending_content_clicked", {
                          itemId: item.id,
                          rank: item.rank,
                          reason: item.reason,
                          type: item.type,
                        })
                      }
                      rel="noreferrer"
                      target="_blank"
                    >
                      {item.title}
                    </a>
                  ) : (
                    <span>{item.title}</span>
                  )}
                  <small>
                    {item.type ?? "content"}
                    {item.viewCount ? ` / ${item.viewCount.toLocaleString()} fixture views` : ""}
                    {item.timeWindow ? ` / ${item.timeWindow}` : ""}
                  </small>
                  {item.reason ? <p>{item.reason}</p> : null}
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
