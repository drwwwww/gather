import Link from "next/link";
import { Music, Baby, Coffee, User } from "lucide-react";
import Badge from "../ui/Badge";

export type PendingRow = {
  id: string;
  role: string;
  assignee: string;
  status: string;
};

function stitchIconForRole(role: string) {
  const r = role.toLowerCase();
  if (r.includes("music") || r.includes("choir") || r.includes("worship") || r.includes("band")) return Music;
  if (r.includes("nursery") || r.includes("child") || r.includes("kids")) return Baby;
  if (r.includes("coffee") || r.includes("hospitality") || r.includes("host")) return Coffee;
  return User;
}

/** Stitch layout: sits on app canvas — not wrapped in `card` / `card-elevated`. */
export default function PendingConfirmationsCard({ items }: { items: PendingRow[] }) {
  return (
    <section className="min-w-0">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 sm:mb-8">
        <h2 className="m-0 text-[13px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Pending Confirmations</h2>
        <Link
          href="/volunteers"
          className="text-sm font-bold text-[#f59e0b] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#f59e0b]/30 rounded-sm"
        >
          View All Requests
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg bg-[var(--surface-container)] px-6 py-10 text-center text-sm text-[var(--text-muted)]">
          All caught up — no pending responses for this service.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg bg-[var(--surface-container)]">
          <div className="space-y-1 p-2">
            {items.map((item) => {
              const Icon = stitchIconForRole(item.role);
              return (
                <div
                  key={item.id}
                  className="group flex items-center justify-between rounded-md bg-[var(--surface-container-lowest)] p-6 transition-colors hover:bg-[var(--nav-pill-active-bg)]"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--surface-container-low)] text-[var(--nav-active-foreground)]">
                      <Icon className="h-6 w-6" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <p className="m-0 truncate font-bold text-[var(--text-primary)]">{item.assignee}</p>
                      <p className="m-0 mt-0.5 text-xs uppercase tracking-wider text-[var(--text-muted)]">{item.role}</p>
                    </div>
                  </div>
                  <div className="hidden shrink-0 gap-3 opacity-0 transition-opacity group-hover:opacity-100 sm:flex">
                    <Link
                      href="/notifications"
                      className="rounded-full px-4 py-2 text-sm font-bold text-[#f59e0b] hover:bg-[#f59e0b]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#f59e0b]/25"
                    >
                      Remind
                    </Link>
                    <Link
                      href="/volunteers"
                      className="rounded-full border border-[var(--border)] bg-gradient-to-br from-[#f59e0b] to-[#d97706] px-6 py-2 text-sm font-bold text-white transition-[filter] hover:brightness-105 active:brightness-95"
                    >
                      Confirm
                    </Link>
                  </div>
                  <div className="sm:hidden">
                    <Badge variant={item.status === "DECLINED" ? "danger" : "neutral"}>{item.status}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
