"use client";

import { Button } from "../ui/button";

const DONUT_R = 54;
const DONUT_C = 2 * Math.PI * DONUT_R;

type NextServiceReadinessStripProps = {
  serviceLabel: string;
  totalSlots: number;
  openSlots: number;
  pendingConfirmations: number;
  confirmedCount: number;
  declinedCount: number;
  onGenerate: () => void;
  onCopyLast: () => void;
  onSendReminders: () => void;
};

export default function NextServiceReadinessStrip({
  serviceLabel,
  totalSlots,
  openSlots,
  pendingConfirmations,
  confirmedCount,
  declinedCount,
  onGenerate,
  onCopyLast,
  onSendReminders,
}: NextServiceReadinessStripProps) {
  // confirmed = solid amber arc; pending = muted arc; open = gray track
  const assignedOrMore = Math.max(0, totalSlots - openSlots); // confirmed + pending + declined
  const confirmedPct = totalSlots > 0 ? confirmedCount / totalSlots : 0;
  const assignedPct  = totalSlots > 0 ? assignedOrMore / totalSlots : 0;
  const confirmedPctLabel = totalSlots > 0 ? Math.round(confirmedPct * 100) : 0;

  // SVG dash values: layer 1 = assigned+, layer 2 = confirmed only (draws on top)
  const assignedDashOffset  = DONUT_C * (1 - assignedPct);
  const confirmedDashOffset = DONUT_C * (1 - confirmedPct);

  return (
    <section className="stitch-section-card space-y-4 text-center">
      <h2 className="m-0 text-xl font-bold text-[var(--text-primary)]">Team readiness</h2>

      {totalSlots > 0 ? (
        <div className="relative mx-auto flex h-36 w-36 items-center justify-center">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 144 144" role="img" aria-label={`${confirmedPctLabel}% confirmed`}>
            {/* Track */}
            <circle cx="72" cy="72" r={DONUT_R} fill="transparent" stroke="var(--outline-variant)" strokeWidth="12" />
            {/* Pending arc (confirmed + pending combined) — muted amber */}
            {assignedOrMore > 0 && (
              <circle
                cx="72" cy="72" r={DONUT_R}
                fill="transparent"
                stroke="var(--primary-soft)"
                strokeWidth="12"
                strokeDasharray={DONUT_C}
                strokeDashoffset={assignedDashOffset}
                strokeLinecap="round"
                className="transition-[stroke-dashoffset] duration-500 ease-out"
              />
            )}
            {/* Confirmed arc — solid amber, drawn on top */}
            {confirmedCount > 0 && (
              <circle
                cx="72" cy="72" r={DONUT_R}
                fill="transparent"
                stroke="var(--nav-active-foreground)"
                strokeWidth="12"
                strokeDasharray={DONUT_C}
                strokeDashoffset={confirmedDashOffset}
                strokeLinecap="round"
                className="transition-[stroke-dashoffset] duration-500 ease-out"
              />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold tabular-nums text-[var(--text-primary)]">{confirmedPctLabel}%</span>
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Confirmed</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface-2)]">
            <svg className="h-7 w-7 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <p className="m-0 text-sm font-semibold text-[var(--text-primary)]">No slots yet</p>
        </div>
      )}

      <p className="m-0 text-sm leading-relaxed text-[var(--text-muted)]">
        <span className="font-semibold text-[var(--text-primary)]">{serviceLabel}</span>
        {totalSlots > 0 ? (
          <>
            <br />
            <span className="font-semibold text-[var(--text-primary)]">{confirmedCount}</span> confirmed
            {pendingConfirmations > 0 ? ` · ${pendingConfirmations} pending` : ""}
            {openSlots > 0 ? ` · ${openSlots} open` : ""}.
          </>
        ) : (
          <>
            <br />
            Add slots or link a service plan to see coverage.
          </>
        )}
      </p>

      {totalSlots > 0 ? (
        <div className="grid grid-cols-2 gap-2 text-left text-xs sm:grid-cols-4">
          <div className="rounded-lg bg-[var(--surface-container-low)] px-2 py-2">
            <p className="m-0 text-[var(--text-muted)]">Open</p>
            <p className="m-0 font-semibold text-[var(--warning)]">{openSlots}</p>
          </div>
          <div className="rounded-lg bg-[var(--surface-container-low)] px-2 py-2">
            <p className="m-0 text-[var(--text-muted)]">Pending</p>
            <p className="m-0 font-semibold text-[var(--text-primary)]">{pendingConfirmations}</p>
          </div>
          <div className="rounded-lg bg-[var(--surface-container-low)] px-2 py-2">
            <p className="m-0 text-[var(--text-muted)]">Confirmed</p>
            <p className="m-0 font-semibold text-[var(--success)]">{confirmedCount}</p>
          </div>
          <div className="rounded-lg bg-[var(--surface-container-low)] px-2 py-2">
            <p className="m-0 text-[var(--text-muted)]">Declined</p>
            <p className="m-0 font-semibold text-[var(--danger)]">{declinedCount}</p>
          </div>
        </div>
      ) : (
        <p className="m-0 text-sm text-[var(--text-muted)]">No slots scheduled for this date.</p>
      )}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onGenerate}
          className="w-full rounded-full bg-[var(--nav-pill-active-bg)] py-3 text-sm font-bold text-[var(--nav-active-foreground)] transition-colors hover:brightness-95"
        >
          Generate schedule
        </button>
        <Button size="sm" variant="secondary" className="w-full rounded-full" onClick={onCopyLast}>
          Copy last service
        </Button>
        <Button size="sm" variant="secondary" className="w-full rounded-full" onClick={onSendReminders}>
          Send reminders
        </Button>
      </div>
    </section>
  );
}
