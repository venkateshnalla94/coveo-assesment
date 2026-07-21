export function GenerativeNoAnswer({ onRetry, query }: { onRetry: () => void; query: string }) {
  return (
    <div className="generative-message">
      <p>No generated answer is available for {query}.</p>
      <button className="secondary-button" onClick={onRetry} type="button">
        Retry
      </button>
    </div>
  );
}
