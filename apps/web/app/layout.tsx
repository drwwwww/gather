import "./globals.css";
import type { ReactNode } from "react";

/** Cookie/session auth + Supabase browser client require request-time rendering; avoids prerender errors. */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gather",
  description: "Church coordination platform"
};

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
      </body>
    </html>
  );
}
