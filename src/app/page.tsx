import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { HomeHero } from "@/components/search/HomeHero";
import { resolveHeadlessCommerceAuthConfig } from "@/features/commerce/headless/commerce-auth-resolver";
import { resolveRuntimeConfig } from "@/lib/runtime/runtime-config";

export default function Home() {
  const runtimeConfig = resolveRuntimeConfig();
  const commerceAuthConfig = resolveHeadlessCommerceAuthConfig(runtimeConfig);

  return (
    <div className="search-app">
      <Header activePath="/" authConfig={commerceAuthConfig} />
      <main className="search-home">
        <HomeHero />
      </main>
      <Footer />
    </div>
  );
}
