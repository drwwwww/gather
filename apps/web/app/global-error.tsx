"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// Deliberately not using next/error's <NextError> component here — it's the
// legacy Pages Router error component, and rendering it inside the App
// Router's global-error boundary crashes Next's static generation of the
// auto-generated /404 and /500 pages ("Cannot read properties of null
// (reading 'useRef')"). Plain markup avoids that broken code path entirely.
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "sans-serif", background: "#fffcf8", color: "#1c1209" }}>
        <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ fontSize: 14, color: "#9c8778", maxWidth: 360 }}>
            We've been notified and are looking into it. Try refreshing the page.
          </p>
        </div>
      </body>
    </html>
  );
}
