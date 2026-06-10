"use client";

import Link from "next/link";
import { Bell, CheckCircle2 } from "lucide-react";
import type { PendingRow } from "../dashboard/PendingConfirmationsCard";
import Badge from "../ui/Badge";

type PendingResponsesCardProps = {
  items: PendingRow[];
  onFollowUp: () => void;
};

export default function PendingResponsesCard({ items, onFollowUp }: PendingResponsesCardProps) {
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <section className="stitch-section-card space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Bell className="h-6 w-6 shrink-0 text-amber-500" aria-hidden />
          <h2 className="m-0 text-xl font-bold text-[var(--text-primary)]">Pending responses</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {safeItems.length > 0 ? (
            <button
              type="button"
              className="text-sm font-semibold text-[#f59e0b] underline-offset-2 hover:underline"
              onClick={onFollowUp}
            >
              Send reminders
            </button>
          ) : null}
          <Link
            href="/people"
            className="text-xs font-semibold text-[var(--text-muted)] underline-offset-2 hover:text-[var(--text-primary)] hover:underline"
          >
            People
          </Link>
        </div>
      </div>

      {safeItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--outline-variant)]/50 bg-[var(--surface-container-low)] px-6 py-8 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-container-high)]">
            <CheckCircle2 className="h-5 w-5 text-[var(--text-muted)]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">All caught up</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">No pending responses for this service.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {safeItems.map((row) => (
            <div
              key={row.id}
              className="space-y-3 rounded-2xl border border-amber-200/80 bg-amber-50 p-4 text-left"
            >
              <div className="border-l-4 border-amber-400 pl-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="m-0 text-sm font-bold text-amber-950">Response pending</p>
                    <p className="mt-1 text-xs text-amber-900/80">
                      {row.assignee} · {row.role}
                    </p>
                  </div>
                  <Badge variant="neutral">{row.status}</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
