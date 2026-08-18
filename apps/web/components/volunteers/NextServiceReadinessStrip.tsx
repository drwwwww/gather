"use client";

import { Send, ArrowRight } from "lucide-react";

const DONUT_R = 48;
const DONUT_C = 2 * Math.PI * DONUT_R;

type NextServiceReadinessStripProps = {
  serviceLabel: string;
  totalSlots: number;
  openSlots: number;
  pendingConfirmations: number;
  confirmedCount: number;
  declinedCount: number;
  bulletinPlanHref?: string | null;
  onGenerate: () => void;
  onCopyLast: () => void;
  onSendReminders: () => void;
  sendingReminders?: boolean;
};

const STAT_ROWS = [
  { key: "confirmed", label: "Confirmed", bar: "bg-emerald-400", text: "text-emerald-700" },
  { key: "pending",   label: "Pending",   bar: "bg-slate-300",   text: "text-slate-600"  },
  { key: "open",      label: "Open",      bar: "bg-amber-300",   text: "text-amber-700"  },
  { key: "declined",  label: "Declined",  bar: "bg-red-300",     text: "text-red-600"    },
] as const;

export default function NextServiceReadinessStrip({
  serviceLabel, totalSlots, openSlots, pendingConfirmations,
  confirmedCount, declinedCount, bulletinPlanHref,
  onSendReminders, sendingReminders = false,
}: NextServiceReadinessStripProps) {
  const confirmedPct = totalSlots > 0 ? Math.round((confirmedCount / totalSlots) * 100) : 0;
  const assignedOrMore = Math.max(0, totalSlots - openSlots);
  const assignedPct = totalSlots > 0 ? assignedOrMore / totalSlots : 0;
  const confirmedFrac = totalSlots > 0 ? confirmedCount / totalSlots : 0;

  const assignedDashOffset  = DONUT_C * (1 - assignedPct);
  const confirmedDashOffset = DONUT_C * (1 - confirmedFrac);

  const counts: Record<string, number> = {
    confirmed: confirmedCount,
    pending:   pendingConfirmations,
    open:      openSlots,
    declined:  declinedCount,
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      {/* Header */}
      <div className="border-b border-[var(--border)] px-5 py-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Team readiness</p>
          {bulletinPlanHref && (
            <a href={bulletinPlanHref} className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 no-underline transition-colors hover:text-amber-800">
              View plan <ArrowRight className="h-3 w-3" />
            </a>
          )}
        </div>
        <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{serviceLabel}</p>
      </div>

      <div className="px-5 py-5 space-y-5">
        {totalSlots === 0 ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-2)]">
              <svg className="h-6 w-6 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">No team scheduled</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Generate a schedule to see coverage here.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Donut + percentage */}
            <div className="flex items-center gap-4">
              <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" aria-label={`${confirmedPct}% confirmed`} role="img">
                  <circle cx="60" cy="60" r={DONUT_R} fill="transparent" stroke="var(--outline-variant)" strokeWidth="12" />
                  {assignedOrMore > 0 && (
                    <circle cx="60" cy="60" r={DONUT_R} fill="transparent" stroke="#fde68a" strokeWidth="12"
                      strokeDasharray={DONUT_C} strokeDashoffset={assignedDashOffset} strokeLinecap="round"
                      className="transition-[stroke-dashoffset] duration-500 ease-out" />
                  )}
                  {confirmedCount > 0 && (
                    <circle cx="60" cy="60" r={DONUT_R} fill="transparent" stroke="#34d399" strokeWidth="12"
                      strokeDasharray={DONUT_C} strokeDashoffset={confirmedDashOffset} strokeLinecap="round"
                      className="transition-[stroke-dashoffset] duration-500 ease-out" />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black tabular-nums text-[var(--text-primary)]">{confirmedPct}%</span>
                </div>
              </div>
              <div className="space-y-1 min-w-0">
                <p className="text-xs font-medium text-[var(--text-muted)]">confirmed</p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {confirmedCount} of {totalSlots} slots
                </p>
                {declinedCount > 0 && (
                  <p className="text-xs text-red-500">{declinedCount} declined</p>
                )}
              </div>
            </div>

            {/* Stat bars */}
            <div className="space-y-2.5">
              {STAT_ROWS.map(({ key, label, bar, text }) => {
                const val = counts[key] ?? 0;
                if (val === 0) return null;
                const pct = totalSlots > 0 ? (val / totalSlots) * 100 : 0;
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-muted)]">{label}</span>
                      <span className={`font-semibold tabular-nums ${text}`}>{val}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
                      <div className={`h-full rounded-full transition-all duration-500 ease-out ${bar}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 border-t border-[var(--border)] pt-4">
          <button
            type="button"
            onClick={onSendReminders}
            disabled={totalSlots === 0 || pendingConfirmations === 0 || sendingReminders}
            className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-container-low)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
            {sendingReminders ? "Sending…" : "Send reminders"}
            {pendingConfirmations > 0 && (
              <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                {pendingConfirmations}
              </span>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
