import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SearchExperience } from "@/components/search/SearchExperience";
import type { SearchInsightsContent } from "@/components/search/layout/SearchInsightsRail";
import sampleSearchResponseJson from "@/data/sample-coveo-search-response.json";
import searchInsightsJson from "@/data/search-insights.json";
import { mapCoveoSearchResponse } from "@/features/search/providers/coveo-response-mapper";
import { getSearchFeatureFlags } from "@/lib/features/search-feature-flags.server";

export default async function Home() {
  const featureFlags = getSearchFeatureFlags();
  const sampleSearchResponse = mapCoveoSearchResponse(sampleSearchResponseJson);

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
