"use client";

import { AlertCircle, XCircle } from "lucide-react";

type DeclinedItem = {
  id: string;
  role: string;
  detail: string;
};

type DeclinedCardProps = {
  items: DeclinedItem[];
};

export default function DeclinedCard({ items }: DeclinedCardProps) {
  const safeItems = Array.isArray(items) ? items : [];
  return (
    <section className="stitch-section-card space-y-6">
      <div className="flex items-center gap-3">
        <AlertCircle className="h-6 w-6 shrink-0 text-red-600" aria-hidden />
        <h2 className="m-0 text-xl font-bold text-[var(--text-primary)]">Declined</h2>
        <span className="ml-auto text-xs font-medium text-[var(--text-muted)]">{safeItems.length} declined</span>
      </div>
      <div className="space-y-4">
        {safeItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--outline-variant)]/50 bg-[var(--surface-container-low)] px-6 py-8 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-container-high)]">
              <XCircle className="h-5 w-5 text-[var(--text-muted)]" />
            </div>
            <p className="text-sm font-medium text-[var(--text-primary)]">No declined assignments</p>
          </div>
        ) : (
          safeItems.slice(0, 6).map((item) => (
            <div
              key={item.id}
              className="space-y-3 rounded-2xl border border-red-200/80 bg-red-50 p-4 text-left"
            >
              <div className="border-l-4 border-red-400 pl-3">
                <p className="m-0 text-sm font-bold text-red-950">Replacement may be needed</p>
                <p className="mt-1 text-xs text-red-800/90">
                  {item.detail} · {item.role}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
