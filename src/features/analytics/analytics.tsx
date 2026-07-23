"use client";

import type { Relay } from "@coveo/headless/commerce";
import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

export type AnalyticsEventName =
  | "search_submitted"
  | "query_suggestion_selected"
  | "facet_selected"
  | "facet_removed"
  | "filters_cleared"
  | "sort_changed"
  | "page_changed"
  | "result_clicked"
  | "zero_results_displayed"
  | "generative_answer_requested"
  | "generative_answer_viewed"
  | "generative_answer_failed"
  | "generative_no_answer"
  | "generative_citation_clicked"
  | "generative_feedback_submitted"
  | "trending_content_clicked"
  | "trending_article_opened"
  | "trending_source_visited"
  | "feature_flag_exposure"
  | "commerce_search_submitted"
  | "commerce_product_clicked"
  | "commerce_facet_selected"
  | "commerce_facet_removed"
  | "commerce_page_changed"
  | "product_compare_added"
  | "product_compare_removed"
  | "product_compare_opened"
  | "product_details_opened"
  | "contact_sales_clicked"
  | "request_quote_clicked";

export interface AnalyticsEvent<TPayload = Record<string, unknown>> {
  name: AnalyticsEventName;
  timestamp: string;
  payload: TPayload;
}

export interface AnalyticsProvider {
  track(event: AnalyticsEvent): void | Promise<void>;
  /** Attaches (or detaches, via `undefined`) the live engine's Relay client once the engine exists. */
  attachRelay?(relay: Relay | undefined): void;
}

export class ConsoleAnalyticsProvider implements AnalyticsProvider {
  track(event: AnalyticsEvent): void {
    console.info("[analytics]", event);
  }
}

/**
 * Search-submit, facet-select, and pagination events are already logged natively by the
 * Headless commerce engine (analytics.enabled: true). This provider only needs to forward the
 * app-level events that have no native equivalent (compare, details, CTA clicks) onto the same
 * Relay client so they land in the same Coveo Event stream and can feed ML/ART.
 */
export class CoveoAnalyticsProvider implements AnalyticsProvider {
  private relay: Relay | undefined;
  private queue: AnalyticsEvent[] = [];

  attachRelay(relay: Relay | undefined): void {
    this.relay = relay;

    if (relay && this.queue.length > 0) {
      const pending = this.queue;
      this.queue = [];
      pending.forEach((event) => this.emit(relay, event));
    }
  }

  track(event: AnalyticsEvent): void {
    if (!this.relay) {
      this.queue.push(event);
      return;
    }

    this.emit(this.relay, event);
  }

  private emit(relay: Relay, event: AnalyticsEvent): void {
    relay.emit(`robomotion/${event.name}`, { ...event.payload, timestamp: event.timestamp });
  }
}

class NoopAnalyticsProvider implements AnalyticsProvider {
  track(): void {}
}

export type Analytics = {
  track: (name: AnalyticsEventName, payload?: Record<string, unknown>) => void;
  attachRelay: (relay: Relay | undefined) => void;
};

const noopAnalytics: Analytics = {
  attachRelay: () => {},
  track: () => {},
};

const AnalyticsContext = createContext<Analytics>(noopAnalytics);

export function AnalyticsProviderRoot({
  children,
  enabled,
  provider,
}: {
  children: ReactNode;
  enabled: boolean;
  provider: AnalyticsProvider;
}) {
  const analytics = useMemo<Analytics>(() => {
    const resolvedProvider: AnalyticsProvider = enabled ? provider : new NoopAnalyticsProvider();

    return {
      attachRelay: (relay) => resolvedProvider.attachRelay?.(relay),
      track: (name, payload) => {
        void resolvedProvider.track({
          name,
          timestamp: new Date().toISOString(),
          payload: payload ?? {},
        });
      },
    };
  }, [enabled, provider]);

  return <AnalyticsContext.Provider value={analytics}>{children}</AnalyticsContext.Provider>;
}

export function useAnalytics() {
  return useContext(AnalyticsContext);
}

export function createSearchAnalyticsPayload(input: {
  query?: string;
  searchHub?: string;
  resultId?: string;
  type?: string;
  position?: number;
}) {
  return Object.fromEntries(
    Object.entries({
      query: input.query,
      searchHub: input.searchHub,
      resultId: input.resultId,
      type: input.type,
      position: input.position,
    }).filter(([, value]) => value !== undefined && value !== ""),
  );
}
