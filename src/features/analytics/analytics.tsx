"use client";

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
}

export class ConsoleAnalyticsProvider implements AnalyticsProvider {
  track(event: AnalyticsEvent): void {
    console.info("[analytics]", event);
  }
}

export class CoveoAnalyticsProvider implements AnalyticsProvider {
  track(): void {
    // Coveo Headless owns live usage analytics in the current architecture.
  }
}

class NoopAnalyticsProvider implements AnalyticsProvider {
  track(): void {}
}

export type Analytics = {
  track: (name: AnalyticsEventName, payload?: Record<string, unknown>) => void;
};

const noopAnalytics: Analytics = {
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
    const resolvedProvider = enabled ? provider : new NoopAnalyticsProvider();

    return {
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
