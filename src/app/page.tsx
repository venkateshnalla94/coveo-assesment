import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SearchExperience } from "@/components/search/SearchExperience";
import type { SearchInsightsContent } from "@/components/search/layout/SearchInsightsRail";
import sampleSearchResponseJson from "@/data/sample-coveo-search-response.json";
import searchInsightsJson from "@/data/search-insights.json";
import { mapCoveoSearchResponse } from "@/features/search/providers/coveo-response-mapper";
import { toSearchFeatureFlags } from "@/lib/features/search-feature-flags";
import { resolveRuntimeConfig } from "@/lib/runtime/runtime-config";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const runtimeConfig = resolveRuntimeConfig({ searchParams: await searchParams });
  const sampleSearchResponse = mapCoveoSearchResponse(sampleSearchResponseJson);

  return (
    <div className="search-app">
      <Header />
      <SearchExperience
        capabilities={runtimeConfig.capabilities}
        development={runtimeConfig.development}
        environment={runtimeConfig.environment}
        featureFlags={toSearchFeatureFlags(runtimeConfig.featureFlags)}
        insightsContent={searchInsightsJson as SearchInsightsContent}
        profile={runtimeConfig.demoProfile}
        scenario={runtimeConfig.scenario}
        sampleSearchResponse={sampleSearchResponse}
      />
      <Footer />
    </div>
  );
}
