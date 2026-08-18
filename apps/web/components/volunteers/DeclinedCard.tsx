"use client";

import { UserX, CheckCircle2 } from "lucide-react";

type DeclinedItem = {
  id: string;
  role: string;
  detail: string;
};

type DeclinedCardProps = {
  items: DeclinedItem[];
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

export default function DeclinedCard({ items }: DeclinedCardProps) {
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <UserX className="h-4 w-4 text-red-500" aria-hidden />
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Declined
            {safeItems.length > 0 && (
              <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-600">
                {safeItems.length}
              </span>
            )}
          </h2>
        </div>
        {safeItems.length > 0 && (
          <p className="text-xs text-[var(--text-muted)]">Reassign in the table above</p>
        )}
      </div>

      {/* Body */}
      {safeItems.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">No declines</p>
          <p className="text-xs text-[var(--text-muted)]">Everyone is confirmed or pending.</p>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {safeItems.slice(0, 6).map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-5 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-[11px] font-bold text-red-600">
                {initials(item.detail)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{item.detail}</p>
                <p className="truncate text-xs text-[var(--text-muted)]">{item.role}</p>
              </div>
              <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-red-500">
                Declined
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
