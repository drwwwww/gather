import Link from "next/link";
import { Megaphone } from "lucide-react";

export type AnnouncementPreview = {
  id: string;
  title: string;
  status: string;
  publishAt: string | null;
  excerpt?: string;
};

function excerptLabel(publishAt: string | null, status: string) {
  const s = status.toLowerCase();
  if (s === "draft") return "Draft";
  if (publishAt) return publishAt;
  return "Recently";
}

/** Stitch layout: sits on app canvas — not wrapped in `card` / `card-elevated`. */
export default function LatestAnnouncementsCard({ items }: { items: AnnouncementPreview[] }) {
  return (
    <section className="min-w-0">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 sm:mb-8">
        <h2 className="m-0 text-[13px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Announcements</h2>
        <Link
          href="/announcements"
          className="text-sm font-bold text-[#f59e0b] transition-colors hover:text-amber-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#f59e0b]/30 rounded-sm"
        >
          View all
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="px-1 py-8 text-center sm:py-10">
          <Megaphone className="mx-auto mb-3 h-8 w-8 text-[var(--text-muted)]" aria-hidden />
          <p className="m-0 text-sm font-semibold text-[var(--text-primary)]">Keep your congregation in the loop</p>
          <p className="m-0 mt-1 text-xs text-[var(--text-muted)]">Your first announcement will appear here once published.</p>
          <Link
            href="/announcements"
            className="mt-4 inline-block text-sm font-bold text-[#f59e0b] transition-colors hover:text-amber-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#f59e0b]/30 rounded-sm"
          >
            Write your first announcement
          </Link>
        </div>
      ) : (
        <div className="space-y-6 px-1">
          {items.map((item, i) => {
            const accent = i === 0 ? "bg-[var(--nav-active-foreground)]" : "bg-[var(--border)]";
            return (
              <div key={item.id} className="flex gap-4">
                <div className={`w-2 shrink-0 rounded-full ${accent}`} aria-hidden />
                <div className="min-w-0">
                  <h3 className="m-0 text-base font-bold text-[var(--text-primary)]">{item.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--text-muted)]">
                    {item.excerpt?.trim() || "No preview available."}
                  </p>
                  <span
                    className={`mt-2 block text-[10px] font-bold uppercase ${i === 0 ? "text-[var(--nav-active-foreground)]" : "text-[var(--text-muted)]"}`}
                  >
                    {excerptLabel(item.publishAt, item.status)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
