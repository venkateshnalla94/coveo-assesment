"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { TrendingContent } from "@/components/content/TrendingContent";
import { SearchBox } from "@/components/search/SearchBox";
import { SEARCH_UI } from "@/components/search/search-ui.constants";
import type { HeadlessCommerceAuthConfig } from "@/features/commerce/headless/commerce-auth";
import { useHomeCommerceSuggestions } from "@/features/commerce/headless/use-home-commerce-suggestions";
import { CoveoContentTrendingProvider } from "@/features/trending/providers/coveo-content-trending-provider";

const popularSearches = [
  "welding arm",
  "robot controller",
  "gripper",
  "servo motor",
  "safety sensor",
];

export function HomeSearchExperience({
  authConfig,
}: {
  authConfig: HeadlessCommerceAuthConfig;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(SEARCH_UI.defaultQuery);
  const suggestionsProvider = useHomeCommerceSuggestions({ authConfig });
  const trendingProvider = useMemo(
    () => new CoveoContentTrendingProvider(SEARCH_UI.defaultQuery),
    [],
  );

  function openCatalog(nextQuery: string) {
    const trimmedQuery = nextQuery.trim();

    if (trimmedQuery) {
      router.push(`/catalog?q=${encodeURIComponent(trimmedQuery)}`);
    }
  }

  return (
    <section className="search-home-panel" aria-labelledby="search-home-title">
      <p className="search-home-eyebrow">Industrial robotics catalog</p>
      <h1 id="search-home-title">Find the right RoboMotion products faster</h1>
      <p className="search-home-summary">
        Search live Commerce products by application, part type, controller fit, or buyer need.
      </p>

      <SearchBox
        autoFocus={false}
        isLoading={false}
        onClear={() => setQuery("")}
        onQueryChange={setQuery}
        onSubmit={openCatalog}
        provider={suggestionsProvider}
        query={query}
      />

      <nav aria-label="Popular product searches" className="popular-searches">
        {popularSearches.map((popularQuery) => (
          <Link href={`/catalog?q=${encodeURIComponent(popularQuery)}`} key={popularQuery}>
            {popularQuery}
          </Link>
        ))}
      </nav>

      <TrendingContent
        description="Guides and community resources for robotics buyers, independent of search."
        enabled
        provider={trendingProvider}
        title="Trending Topics"
      />
    </section>
  );
}
