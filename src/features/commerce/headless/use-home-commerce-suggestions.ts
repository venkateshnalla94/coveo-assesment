"use client";

import {
  buildCommerceEngine,
  buildSearch,
  buildSearchBox,
  getOrganizationEndpoints,
  type SearchBox as HeadlessSearchBox,
} from "@coveo/headless/commerce";
import type { CurrencyCodeISO4217 } from "@coveo/relay-event-types";
import { useMemo, useRef } from "react";

import type { SuggestionsProvider } from "@/components/search/use-search-suggestions";
import { COMMERCE_DEFAULTS } from "@/features/commerce/config/commerce-config";
import type { HeadlessCommerceAuthConfig } from "@/features/commerce/headless/commerce-auth";
import type { SearchSuggestion } from "@/features/search/models/search-models";
import { fetchSearchTokenConfig } from "@/lib/coveo/search-token";

const SUGGESTION_WAIT_TIMEOUT_MS = 900;

type HomeSuggestionControllers = {
  searchBox: HeadlessSearchBox;
};

export function useHomeCommerceSuggestions({
  authConfig,
}: {
  authConfig: HeadlessCommerceAuthConfig;
}): SuggestionsProvider {
  const controllersRef = useRef<Promise<HomeSuggestionControllers> | null>(null);

  return useMemo(
    () => ({
      getSuggestions: async (query: string, options?: { signal?: AbortSignal }) => {
        if (authConfig.mode === "configuration-error" || options?.signal?.aborted) {
          return [];
        }

        controllersRef.current ??= createHomeSuggestionControllers(authConfig);
        const controllers = await controllersRef.current;

        if (options?.signal?.aborted) {
          return [];
        }

        controllers.searchBox.updateText(query);
        controllers.searchBox.showSuggestions();

        return waitForSuggestions(controllers.searchBox, options?.signal);
      },
    }),
    [authConfig],
  );
}

async function createHomeSuggestionControllers(
  authConfig: HeadlessCommerceAuthConfig,
): Promise<HomeSuggestionControllers> {
  const resolvedAuth = await resolveCommerceAuth(authConfig);
  const engine = buildCommerceEngine({
    configuration: {
      accessToken: resolvedAuth.token,
      analytics: {
        enabled: true,
        originContext: "Search",
        trackingId: COMMERCE_DEFAULTS.trackingId,
      },
      context: {
        country: COMMERCE_DEFAULTS.country,
        currency: COMMERCE_DEFAULTS.currency as CurrencyCodeISO4217,
        language: COMMERCE_DEFAULTS.language,
        view: {
          url: COMMERCE_DEFAULTS.viewUrl,
        },
      },
      organizationId: resolvedAuth.organizationId,
      organizationEndpoints: getOrganizationEndpoints(resolvedAuth.organizationId),
      ...(resolvedAuth.renewAccessToken ? { renewAccessToken: resolvedAuth.renewAccessToken } : {}),
    },
  });

  buildSearch(engine);

  return {
    searchBox: buildSearchBox(engine),
  };
}

async function resolveCommerceAuth(authConfig: HeadlessCommerceAuthConfig): Promise<{
  organizationId: string;
  renewAccessToken?: () => Promise<string>;
  token: string;
}> {
  if (authConfig.mode === "anonymous-api-key") {
    return {
      organizationId: authConfig.organizationId,
      token: authConfig.accessToken,
    };
  }

  if (authConfig.mode === "configuration-error") {
    throw new Error(authConfig.message);
  }

  const config = await fetchSearchTokenConfig();

  return {
    organizationId: config.organizationId,
    renewAccessToken: async () => {
      const renewedConfig = await fetchSearchTokenConfig();
      return renewedConfig.token;
    },
    token: config.token,
  };
}

function waitForSuggestions(
  searchBox: HeadlessSearchBox,
  signal?: AbortSignal,
): Promise<SearchSuggestion[]> {
  return new Promise((resolve) => {
    const timers: { timeout?: number } = {};
    let hasFinished = false;
    let sawLoading = searchBox.state.isLoadingSuggestions;
    const finish = () => {
      if (hasFinished) {
        return;
      }

      hasFinished = true;
      if (timers.timeout) {
        window.clearTimeout(timers.timeout);
      }
      unsubscribe();
      resolve(
        searchBox.state.suggestions.map((suggestion) => ({
          id: `home-commerce-suggestion-${suggestion.rawValue}`,
          label: suggestion.rawValue,
          value: suggestion.rawValue,
        })),
      );
    };
    const unsubscribe = searchBox.subscribe(() => {
      if (signal?.aborted) {
        finish();
        return;
      }

      if (searchBox.state.isLoadingSuggestions) {
        sawLoading = true;
        return;
      }

      if (sawLoading || searchBox.state.suggestions.length > 0) {
        finish();
      }
    });

    timers.timeout = window.setTimeout(finish, SUGGESTION_WAIT_TIMEOUT_MS);
  });
}
