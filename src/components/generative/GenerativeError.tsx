import { AlertCircle } from "lucide-react";

export function GenerativeError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="generative-message" role="alert">
      <AlertCircle aria-hidden="true" size={18} />
      <p>{message}</p>
      <button className="secondary-button" onClick={onRetry} type="button">
        Retry
      </button>
    </div>
  );
}
