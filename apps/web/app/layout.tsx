import "./globals.css";
import type { ReactNode } from "react";
import * as Sentry from "@sentry/nextjs";
import type { Metadata } from "next";
import AuthTransition from "../components/auth/AuthTransition";

/** Cookie/session auth + Supabase browser client require request-time rendering; avoids prerender errors. */
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return {
    title: "Gather",
    description: "Church coordination platform",
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    },
    other: {
      ...Sentry.getTraceData(),
    },
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="gather">
      <body
        className="min-h-dvh w-full overflow-x-hidden font-sans antialiased"
        style={{ background: "var(--bg)", color: "var(--text-primary)" }}
      >
        <main className="min-h-dvh w-full min-h-0">
          {children}
        </main>
        {/* Lives above the router so it survives the sign-in navigation. */}
        <AuthTransition />
      </body>
    </html>
  );
}
