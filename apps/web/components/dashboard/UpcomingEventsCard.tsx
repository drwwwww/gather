import Link from "next/link";
import { Calendar } from "lucide-react";
import { Card, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

export type EventPreview = {
  id: string;
  title: string;
  startAt: string;
  location: string | null;
  rsvpCount: number;
};

export default function UpcomingEventsCard({ items }: { items: EventPreview[] }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardTitle>Upcoming Events</CardTitle>
        <Link href="/events" className="btn btn-outline btn-sm">
          View events
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed p-6 text-center text-sm" style={{ background: 'var(--gather-surface)', borderColor: 'var(--border)' }}>
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
            <Calendar className="h-5 w-5" />
          </div>
          <p className="font-semibold" style={{ color: 'var(--ink)' }}>No events scheduled</p>
          <p className="mt-2" style={{ color: 'var(--muted)' }}>Create your first event to keep the church engaged.</p>
          <Link href="/events" className="btn btn-outline btn-sm mt-4">
            Create your first event
          </Link>
        </div>
      ) : (
        <div className="mt-4 space-y-3 text-sm">
          {items.map((event) => (
            <div key={event.id} className="rounded-xl p-3" style={{ background: 'var(--gather-surface)' }}>
              <div className="flex items-center justify-between">
                <p className="font-semibold" style={{ color: 'var(--ink)' }}>{event.title}</p>
                <Badge variant="neutral">{event.rsvpCount} RSVP</Badge>
              </div>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                {event.startAt}
                {event.location ? ` - ${event.location}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
