"use client";


import { Users } from "lucide-react";

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
      <div className="card card-elevated p-4 w-full max-w-xl">
        <div className="flex items-center justify-between">
          <div className="card-title">Attendees</div>
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>Close</button>
        </div>
        <div className="mt-4 max-h-[360px] space-y-2 overflow-auto text-sm">
          {attendees.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-8 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)]">
                <Users className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>No attendees yet</p>
              </div>
            </div>
          ) : (
            attendees.map((attendee) => (
              <div key={attendee.id} className="rounded-xl bg-[var(--surface)] p-3">
                <p className="font-medium text-[var(--text-primary)]">{attendee.name || "Member"}</p>
                <p className="text-xs text-[var(--text-muted)]">{attendee.email}</p>
                <p className="text-xs text-[var(--text-muted)]">{attendee.status}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
