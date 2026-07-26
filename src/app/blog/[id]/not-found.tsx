import Link from "next/link";

export default function BlogArticleNotFound() {
  return (
    <main className="blog-page">
      <div className="empty-state">
        <p>This article is no longer available.</p>
        <Link href="/catalog">Back to catalog</Link>
      </div>
    </main>
  );
}
