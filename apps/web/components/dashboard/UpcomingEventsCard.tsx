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
    <div className="rounded-2xl border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "0 1px 2px rgba(16, 24, 40, 0.06)" }}>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>Upcoming Events</h2>
        <Link href="/events" className="btn btn-secondary btn-sm">View all events</Link>
      </div>
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 p-6">
          <span style={{ color: "var(--text-muted)" }}>No upcoming events. Check back soon!</span>
          <Link href="/events" className="btn btn-secondary btn-sm mt-2 inline-flex">Create event</Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Name</th>
                <th className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Date</th>
                <th className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Status</th>
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
