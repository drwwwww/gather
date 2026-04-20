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
      <body className="min-h-screen w-full font-sans antialiased" style={{ background: "var(--bg)", color: "var(--text-primary)" }}>
        <main className="min-h-screen w-full">
          {children}
        </main>
      </body>
    </html>
  );
}
