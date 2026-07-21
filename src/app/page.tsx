import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SearchExperience } from "@/components/search/SearchExperience";
import type { SearchInsightsContent } from "@/components/search/layout/SearchInsightsRail";
import searchInsightsJson from "@/data/search-insights.json";
import { profileFixtures } from "@/features/demo-profiles/profile-fixtures";
import { toSearchFeatureFlags } from "@/lib/features/search-feature-flags";
import { resolveRuntimeConfig } from "@/lib/runtime/runtime-config";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const runtimeConfig = resolveRuntimeConfig({ searchParams: await searchParams });
  const fixtures = profileFixtures[runtimeConfig.demoProfile.id];

  return (
    <div className="search-app">
      <Header />
      <SearchExperience
        capabilities={runtimeConfig.capabilities}
        development={runtimeConfig.development}
        environment={runtimeConfig.environment}
        featureFlags={toSearchFeatureFlags(runtimeConfig.featureFlags)}
        generativeFixture={fixtures.generativeAnswer}
        insightsContent={searchInsightsJson as SearchInsightsContent}
        profile={runtimeConfig.demoProfile}
        scenario={runtimeConfig.scenario}
        sampleSearchResponse={fixtures.searchResponse}
        suggestedQueries={fixtures.suggestedQueries}
        trendingItems={fixtures.trendingItems}
      />
      <Footer />
    </div>
  );
}
