import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SearchExperience } from "@/components/search/SearchExperience";
import type { SearchInsightsContent } from "@/components/search/layout/SearchInsightsRail";
import sampleSearchResponseJson from "@/data/sample-coveo-search-response.json";
import searchInsightsJson from "@/data/search-insights.json";
import type { SearchQuery } from "@/features/search/models/search-models";
import { MockSearchProvider } from "@/features/search/providers/mock-search-provider";
import { getSearchFeatureFlags } from "@/lib/features/search-feature-flags.server";

const defaultSampleQuery: SearchQuery = {
  filters: {},
  page: 1,
  pageSize: 4,
  query: "digital transformation",
  sort: "relevance",
};

export default async function Home() {
  const featureFlags = getSearchFeatureFlags();
  const mockSearchProvider = new MockSearchProvider(sampleSearchResponseJson);
  const sampleSearchResponse = await mockSearchProvider.search(defaultSampleQuery);

  return (
    <div className="search-app">
      <Header />
      <SearchExperience
        featureFlags={featureFlags}
        insightsContent={searchInsightsJson as SearchInsightsContent}
        sampleSearchResponse={sampleSearchResponse}
      />
      <Footer />
    </div>
  );
}
