import { Suspense, type ReactNode } from "react";

export default function JoinLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<JoinFallback />}>{children}</Suspense>;
}

function JoinFallback() {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center px-6 py-16">
      <p className="text-sm text-[var(--text-muted)]">Loading…</p>
    </main>
  );
}
