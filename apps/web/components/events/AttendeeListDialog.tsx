"use client";


type Attendee = {
  id: string;
  name: string;
  email: string;
  status: string;
};

type AttendeeListDialogProps = {
  open: boolean;
  attendees: Attendee[];
  onClose: () => void;
};

export default function AttendeeListDialog({ open, attendees, onClose }: AttendeeListDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="card bg-base-100 shadow-md p-4 rounded-xl w-full max-w-xl">
        <div className="flex items-center justify-between">
          <div className="card-title text-lg font-semibold">Attendees</div>
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>Close</button>
        </div>
        <div className="mt-4 max-h-[360px] space-y-2 overflow-auto text-sm">
          {attendees.length === 0 ? (
            <p className="text-[var(--gather-muted)]">No RSVPs yet.</p>
          ) : (
            attendees.map((attendee) => (
              <div key={attendee.id} className="rounded-xl bg-base-100 p-3">
                <p className="font-medium text-[var(--gather-ink)]">{attendee.name || "Member"}</p>
                <p className="text-xs text-[var(--gather-muted)]">{attendee.email}</p>
                <p className="text-xs text-[var(--gather-muted)]">{attendee.status}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
