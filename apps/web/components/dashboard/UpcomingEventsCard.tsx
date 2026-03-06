import Link from "next/link";
import { formatShortDate } from "../../lib/format";
import Badge from "../ui/Badge";


export type EventRow = {
  id: string;
  name: string;
  date: string;
  status: string;
};

export default function UpcomingEventsCard({ items }: { items: EventRow[] }) {
  return (
    <div className="border rounded bg-white p-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-lg font-medium text-[var(--ink)]">Upcoming Events</h2>
        <Link href="/events">
          <span className="px-2 py-1 rounded bg-gray-200 text-gray-800 text-xs">View all events</span>
        </Link>
      </div>
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 p-6">
          <span className="text-[var(--muted)]">No upcoming events. Check back soon!</span>
          <Link href="/events">
            <span className="px-2 py-1 rounded bg-gray-200 text-gray-800 text-xs mt-2">Create event</span>
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-xs text-[var(--muted)] font-medium uppercase tracking-wide">Name</th>
                <th className="text-xs text-[var(--muted)] font-medium uppercase tracking-wide">Date</th>
                <th className="text-xs text-[var(--muted)] font-medium uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="hover:bg-[var(--surface-2)] transition-colors">
                  <td>{row.name}</td>
                  <td>{formatShortDate(row.date)}</td>
                  <td>
                    <Badge variant="neutral">{row.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
