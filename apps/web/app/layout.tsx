import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Gather Admin",
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
