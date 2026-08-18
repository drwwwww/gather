"use client";

import { Users } from "lucide-react";

type RsvpPanelProps = {
  selectedEventTitle: string | null;
  selectedEventIsPast?: boolean;
  going: number;
  maybe: number;
  no: number;
  onViewAttendees: () => void;
};

function RsvpBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-[var(--text-secondary)]">{label}</span>
        <span className="tabular-nums font-semibold text-[var(--text-primary)]">{count}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
        <div className={`h-full rounded-full transition-all duration-500 ease-out ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function RsvpPanel({ selectedEventTitle, selectedEventIsPast = false, going, maybe, no, onViewAttendees }: RsvpPanelProps) {
  const total = going + maybe + no;

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">RSVP Breakdown</h3>
        {selectedEventTitle && (
          <button type="button" onClick={onViewAttendees}
            className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 transition-colors hover:text-amber-800">
            <Users className="h-3.5 w-3.5" />
            View all
          </button>
        )}
      </div>

      {!selectedEventTitle ? (
        <div className="flex flex-col items-center gap-3 px-5 py-8 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)]">
            <Users className="h-5 w-5 text-[var(--text-muted)]" />
          </div>
          <p className="text-sm text-[var(--text-muted)]">Select an event to see RSVPs</p>
        </div>
      ) : (
        <div className="px-5 py-4 space-y-4">
          <p className="truncate text-xs font-medium text-[var(--text-muted)]">{selectedEventTitle}</p>

          {/* Big number */}
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-[var(--text-primary)]">{going}</span>
            <span className="text-sm text-[var(--text-muted)]">{selectedEventIsPast ? "attended" : "going"}{total > 0 ? ` of ${total} responses` : ""}</span>
          </div>

          {/* Bars */}
          <div className="space-y-3">
            <RsvpBar label={selectedEventIsPast ? "Attended" : "Going"} count={going} total={total} color="bg-green-400" />
            <RsvpBar label="Maybe" count={maybe} total={total} color="bg-amber-400" />
            <RsvpBar label="Not going" count={no} total={total} color="bg-slate-300" />
          </div>
        </div>
      )}
    </div>
  );
}
