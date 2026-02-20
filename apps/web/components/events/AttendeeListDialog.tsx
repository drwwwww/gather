"use client";

import { Button } from "../ui/button";
import { Card, CardTitle } from "../ui/card";

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
      <Card className="w-full max-w-xl">
        <div className="flex items-center justify-between">
          <CardTitle>Attendees</CardTitle>
          <Button size="sm" variant="outline" onClick={onClose}>Close</Button>
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
      </Card>
    </div>
  );
}
