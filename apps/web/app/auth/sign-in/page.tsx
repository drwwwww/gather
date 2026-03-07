"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignInRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  useEffect(() => {
    const url = next ? `/login?next=${encodeURIComponent(next)}` : "/login";
    router.replace(url);
  }, [router, next]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-[var(--text-muted)]">Redirecting...</p>
    </main>
  );
}
