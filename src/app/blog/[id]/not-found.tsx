import Link from "next/link";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { resolveHeadlessCommerceAuthConfig } from "@/features/commerce/headless/commerce-auth-resolver";
import { resolveRuntimeConfig } from "@/lib/runtime/runtime-config";

export default function BlogArticleNotFound() {
  const runtimeConfig = resolveRuntimeConfig();
  const commerceAuthConfig = resolveHeadlessCommerceAuthConfig(runtimeConfig);

  return (
    <div className="search-app">
      <Header activePath="/blog" authConfig={commerceAuthConfig} />
      <main className="blog-page">
        <div className="empty-state">
          <p>This article is no longer available.</p>
          <Link href="/catalog">Back to catalog</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
