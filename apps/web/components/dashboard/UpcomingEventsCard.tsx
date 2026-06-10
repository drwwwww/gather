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

function calendarParts(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { mon: "—", day: "—" };
  return {
    mon: d.toLocaleString("en", { month: "short" }).toUpperCase(),
    day: String(d.getDate()),
  };
}

export default function UpcomingEventsCard({
  items,
  variant = "default",
}: {
  items: EventRow[];
  variant?: "default" | "stitch";
}) {
  if (variant === "stitch") {
    return (
      <section className="card card-elevated flex flex-col p-6">
        <h2 className="mb-4 m-0 shrink-0 text-[13px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Next Events</h2>
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface-container)] px-4 py-8 text-center">
            <Calendar className="h-8 w-8 text-[var(--text-muted)]" />
            <div>
              <p className="m-0 text-sm font-semibold text-[var(--text-primary)]">Your first event is one click away</p>
              <p className="m-0 mt-1 text-xs text-[var(--text-muted)]">Schedule a service, rehearsal, or gathering and your team will see it here.</p>
            </div>
            <Link href="/events" className="mt-1 inline-flex items-center justify-center rounded-full bg-amber-500 px-4 py-1.5 text-sm font-bold text-white no-underline transition-colors hover:bg-amber-600">
              Create an event
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((row) => {
              const { mon, day } = calendarParts(row.date);
              return (
                <Link key={row.id} href="/events" className="group flex cursor-pointer items-center gap-4 no-underline">
                  <div className="flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-md bg-[var(--nav-pill-active-bg)] transition-colors group-hover:bg-[var(--nav-active-foreground)]">
                    <span className="text-[10px] font-bold uppercase text-[var(--nav-active-foreground)] group-hover:text-white">{mon}</span>
                    <span className="text-lg font-black leading-none text-[var(--nav-active-foreground)] group-hover:text-white">{day}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="m-0 truncate text-sm font-bold text-[var(--text-primary)]">{row.name}</p>
                    <p className="m-0 mt-0.5 text-xs text-[var(--text-muted)]">
                      {formatShortDate(row.date)} · {row.status}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        <Link
          href="/events"
          className="mt-6 flex w-full items-center justify-center rounded-full border border-[#f59e0b]/20 py-3 text-sm font-bold text-[#f59e0b] transition-colors hover:bg-[#f59e0b] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#f59e0b]/35"
        >
          Full Calendar
        </Link>
      </section>
    );
  }

  return (
    <div className="card card-elevated flex h-full min-h-0 flex-col p-6">
      <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-2">
        <h2 className="card-title">Upcoming Events</h2>
        <Link href="/events" className="btn btn-secondary btn-sm">
          View all events
        </Link>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        {items.length === 0 ? (
          <div className="flex min-h-[12rem] flex-1 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-8 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)]">
              <Calendar className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                No upcoming events
              </p>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                Get started by creating a new event.
              </p>
            </div>
            <Link href="/events" className="btn btn-primary-gradient btn-sm mt-2">
              Create event
            </Link>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                    Name
                  </th>
                  <th className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                    Date
                  </th>
                  <th className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-[var(--surface-2)]">
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
