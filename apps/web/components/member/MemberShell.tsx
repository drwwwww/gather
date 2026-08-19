"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function MemberShell({
  churchName,
  displayName,
  children
}: {
  churchName: string;
  displayName: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--text-primary)]">
      <header
        className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg)]"
        style={{ boxShadow: "0 1px 0 color-mix(in oklch, var(--border) 60%, transparent)" }}
      >
        {/* Equal outer columns so the center block is visually centered in the bar */}
        <div className="mx-auto grid max-w-3xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1 px-4 py-3 sm:px-6">
          <div className="min-w-0 justify-self-start self-center">
            <Link
              href="/member"
              className="text-sm font-semibold tracking-tight text-[var(--text-primary)] no-underline hover:opacity-90"
            >
              Gather
            </Link>
          </div>
          <div className="max-w-[min(100%,18rem)] min-w-0 text-center sm:max-w-xs">
            <p className="truncate text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">Your church</p>
            <p className="truncate text-sm font-medium text-[var(--text-primary)]">{churchName}</p>
            <p className="truncate text-xs text-[var(--text-muted)]">Signed in as {displayName}</p>
          </div>
          <nav className="flex min-w-0 shrink-0 items-center justify-end justify-self-end gap-1 self-center">
            <Link
              href="/member/account"
              className={`btn btn-ghost btn-sm ${pathname === "/member/account" ? "bg-[var(--surface-2)]" : ""}`}
            >
              Account
            </Link>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => router.push("/logout")}>
              Log out
            </button>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">{children}</div>
    </div>
  );
}
