import Link from "next/link";
import { Calendar } from "lucide-react";
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
    <div className="card shadow-sm p-6 h-full flex flex-col min-h-0">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 shrink-0">
        <h2 className="card-title">Upcoming Events</h2>
        <Link href="/events" className="btn btn-secondary btn-sm">View all events</Link>
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-8 text-center min-h-[12rem]">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)]">
              <Calendar className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>No upcoming events</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Get started by creating a new event.</p>
            </div>
            <Link href="/events" className="btn btn-primary btn-sm mt-2">
              Create event
            </Link>
          </div>
        ) : (
        <div className="overflow-auto rounded-2xl border border-[var(--border)] min-h-0 flex-1">
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
    </div>
  );
}
