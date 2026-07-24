import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { HomeSearchExperience } from "@/components/search/HomeSearchExperience";
import { resolveHeadlessCommerceAuthConfig } from "@/features/commerce/headless/commerce-auth-resolver";
import { resolveRuntimeConfig } from "@/lib/runtime/runtime-config";

export default function Home() {
  const runtimeConfig = resolveRuntimeConfig();
  const commerceAuthConfig = resolveHeadlessCommerceAuthConfig(runtimeConfig);

  return (
    <div className="search-app">
      <Header activePath="/" />
      <main className="search-home">
        <HomeSearchExperience authConfig={commerceAuthConfig} />
      </main>
      <Footer />
    </div>
  );
}
