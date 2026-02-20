import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Gather Admin",
  description: "Church coordination platform"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="gather-warm">
      <body style={{ background: 'var(--gather-bg)' }}>
        <div className="min-h-screen g-page">{children}</div>
      </body>
    </html>
  );
}
