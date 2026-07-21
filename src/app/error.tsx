"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

import { toApplicationError } from "@/lib/errors/application-error";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const applicationError = toApplicationError(error);

  return (
    <main className="app-shell startup-shell">
      <section className="startup-card" role="alert">
        <p className="eyebrow">Application error</p>
        <h1>Search could not be loaded</h1>
        <p>{applicationError.userMessage}</p>
        {process.env.NODE_ENV !== "production" ? (
          <p className="muted-copy">{applicationError.message}</p>
        ) : null}
        <button className="primary-button" onClick={reset} type="button">
          <RefreshCw aria-hidden="true" size={18} />
          Retry
        </button>
        <AlertCircle aria-hidden="true" className="configuration-icon" size={24} />
      </section>
    </main>
  );
}
