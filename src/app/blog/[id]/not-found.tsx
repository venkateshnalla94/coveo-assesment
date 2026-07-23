import Link from "next/link";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export default function BlogArticleNotFound() {
  return (
    <div className="search-app">
      <Header />
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
