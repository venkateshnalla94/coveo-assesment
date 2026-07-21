import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SearchExperience } from "@/components/search/SearchExperience";
import type { CoveoSearchResponse } from "@/components/search/response/search-response-types";
import type { SearchInsightsContent } from "@/components/search/layout/SearchInsightsRail";
import sampleSearchResponseJson from "@/data/sample-coveo-search-response.json";
import searchInsightsJson from "@/data/search-insights.json";
import { getSearchFeatureFlags } from "@/lib/features/search-feature-flags.server";

export default function Home() {
  const featureFlags = getSearchFeatureFlags();

  return (
    <div className="search-app">
      <Header />
      <SearchExperience
        featureFlags={featureFlags}
        insightsContent={searchInsightsJson as SearchInsightsContent}
        sampleSearchResponse={sampleSearchResponseJson as CoveoSearchResponse}
      />
      <Footer />
    </div>
  );
}
