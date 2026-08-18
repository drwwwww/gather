"use client";

import { Bell, CheckCircle2, Send } from "lucide-react";
import type { PendingRow } from "../dashboard/PendingConfirmationsCard";

type PendingResponsesCardProps = {
  items: PendingRow[];
  onFollowUp: () => void;
  onNudge?: (row: PendingRow) => void;
  nudgingId?: string | null;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

export default function PendingResponsesCard({ items, onFollowUp, onNudge, nudgingId }: PendingResponsesCardProps) {
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Bell className="h-4 w-4 text-amber-500" aria-hidden />
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Pending responses
            {safeItems.length > 0 && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                {safeItems.length}
              </span>
            )}
          </h2>
        </div>
        {safeItems.length > 0 && (
          <button
            type="button"
            onClick={onFollowUp}
            className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 transition-colors hover:text-amber-800"
          >
            <Send className="h-3.5 w-3.5" />
            Send reminders
          </button>
        )}
      </div>

      {/* Body */}
      {safeItems.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">All caught up</p>
          <p className="text-xs text-[var(--text-muted)]">No pending responses for this service.</p>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {safeItems.map((row) => (
            <li key={row.id} className="flex items-center gap-3 px-5 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[11px] font-bold text-amber-700">
                {initials(row.assignee)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{row.assignee}</p>
                <p className="truncate text-xs text-[var(--text-muted)]">{row.role}</p>
              </div>
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Awaiting
              </span>
              {onNudge && (
                <button
                  type="button"
                  title="Send reminder"
                  disabled={nudgingId === row.id}
                  onClick={() => onNudge(row)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-amber-50 hover:text-amber-600 disabled:opacity-40"
                >
                  {nudgingId === row.id
                    ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-300 border-t-transparent" />
                    : <Bell className="h-3.5 w-3.5" />
                  }
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
