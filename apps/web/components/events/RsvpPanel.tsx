"use client";


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
        <span className="text-xs text-[var(--gather-muted)]">Per event</span>
      </div>
      <div className="mt-4 space-y-3 text-sm">
        {!selectedEventTitle ? (
          <p className="text-[var(--gather-muted)]">Select an event to see RSVPs.</p>
        ) : (
          <>
            <p className="text-sm text-[var(--gather-muted)]">{selectedEventTitle}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-[var(--surface)] p-3">
                <p className="text-xs text-[var(--gather-muted)]">Going</p>
                <p className="text-lg font-semibold text-[var(--gather-ink)]">{going}</p>
              </div>
              <div className="rounded-xl bg-[var(--surface)] p-3">
                <p className="text-xs text-[var(--gather-muted)]">Maybe</p>
                <p className="text-lg font-semibold text-[var(--gather-ink)]">{maybe}</p>
              </div>
              <div className="rounded-xl bg-[var(--surface)] p-3">
                <p className="text-xs text-[var(--gather-muted)]">No</p>
                <p className="text-lg font-semibold text-[var(--gather-ink)]">{no}</p>
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
