"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Loader2 } from "lucide-react";

export default function SignInRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  useEffect(() => {
    const url = next ? `/login?next=${encodeURIComponent(next)}` : "/login";
    router.replace(url);
  }, [router, next]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      <p className="text-sm text-[var(--text-muted)]">Redirecting...</p>
    </main>
  );
}
