"use client";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardTitle } from "../ui/card";

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
    <Card>
      <div className="flex items-center justify-between">
        <CardTitle>RSVP Breakdown</CardTitle>
        <span className="text-xs text-[var(--gather-muted)]">Per event</span>
      </div>
      <div className="mt-4 space-y-3 text-sm">
        {!selectedEventTitle ? (
          <p className="text-[var(--gather-muted)]">Select an event to see RSVPs.</p>
        ) : (
          <>
            <p className="text-sm text-[var(--gather-muted)]">{selectedEventTitle}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-base-100 p-3">
                <p className="text-xs text-[var(--gather-muted)]">Going</p>
                <p className="text-lg font-semibold text-[var(--gather-ink)]">{going}</p>
              </div>
              <div className="rounded-xl bg-base-100 p-3">
                <p className="text-xs text-[var(--gather-muted)]">Maybe</p>
                <p className="text-lg font-semibold text-[var(--gather-ink)]">{maybe}</p>
              </div>
              <div className="rounded-xl bg-base-100 p-3">
                <p className="text-xs text-[var(--gather-muted)]">No</p>
                <p className="text-lg font-semibold text-[var(--gather-ink)]">{no}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Badge variant="default">Total {going + maybe + no}</Badge>
              <Button size="sm" variant="outline" onClick={onViewAttendees}>
                View attendee list
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
