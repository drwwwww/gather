"use client";


import { Calendar } from "lucide-react";

type RsvpPanelProps = {
  selectedEventTitle: string | null;
  going: number;
  maybe: number;
  no: number;
  onViewAttendees: () => void;
};
export default function RsvpPanel({
  selectedEventTitle,
  going,
  maybe,
  no,
  onViewAttendees
}: RsvpPanelProps) {
  return (
    <div className="card shadow-sm p-4">
      <div className="flex items-center justify-between">
        <div className="card-title">RSVP Breakdown</div>
        <span className="text-xs text-[var(--text-muted)]">Per event</span>
      </div>
      <div className="mt-4 space-y-3 text-sm">
        {!selectedEventTitle ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-8 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)]">
              <Calendar className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>No event selected</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Select an event to see RSVPs.</p>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-[var(--text-muted)]">{selectedEventTitle}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-[var(--surface)] p-3">
                <p className="text-xs text-[var(--text-muted)]">Going</p>
                <p className="text-lg font-semibold text-[var(--text-primary)]">{going}</p>
              </div>
              <div className="rounded-xl bg-[var(--surface)] p-3">
                <p className="text-xs text-[var(--text-muted)]">Maybe</p>
                <p className="text-lg font-semibold text-[var(--text-primary)]">{maybe}</p>
              </div>
              <div className="rounded-xl bg-[var(--surface)] p-3">
                <p className="text-xs text-[var(--text-muted)]">No</p>
                <p className="text-lg font-semibold text-[var(--text-primary)]">{no}</p>
              </div>
            </div>
            <div className="mt-4">
              <button type="button" className="btn btn-outline btn-sm" onClick={onViewAttendees}>
                View attendees
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
