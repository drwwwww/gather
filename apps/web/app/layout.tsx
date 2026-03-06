import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Gather Admin",
  description: "Church coordination platform"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased" style={{ background: "var(--bg)", color: "var(--text-primary)" }}>
        <main className="mx-auto max-w-7xl px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
