export function GenerativeAnswerSkeleton({ query }: { query: string }) {
  return (
    <div className="generative-skeleton" role="status" aria-live="polite">
      <span>Generating answer for {query}.</span>
      <div />
      <div />
      <div />
    </div>
  );
}
