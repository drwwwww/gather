"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center" style={{ background: "var(--bg)" }}>
      <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "var(--surface-2)" }}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <div>
        <h1 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Something went wrong</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          That's on us — please try again.
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
      >
        Try again
      </button>
    </main>
  );
}
