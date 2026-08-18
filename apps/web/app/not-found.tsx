import Link from "next/link";

// A custom not-found page renders through Next's normal page-build pipeline
// (same as every other route) instead of Next's built-in fallback /404 page,
// which goes through an internal code path that crashes during static
// generation in this monorepo (a styled-jsx + duplicate-React-copy issue).
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center" style={{ background: "var(--bg)" }}>
      <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "var(--surface-2)" }}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <h1 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Page not found</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          This page doesn&apos;t exist or may have moved.
        </p>
      </div>
      <Link href="/admin" className="text-sm font-semibold text-amber-600 hover:underline">
        ← Back to dashboard
      </Link>
    </main>
  );
}
