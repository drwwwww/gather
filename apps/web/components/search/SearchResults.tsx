"use client";

import Link from "next/link";
import { Calendar, Megaphone, UserRound, ArrowRight } from "lucide-react";
import type { Database } from "@gather/lib";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type EventRow = Database["public"]["Tables"]["events"]["Row"];
type AnnouncementRow = Database["public"]["Tables"]["announcements"]["Row"];

type SearchResultsProps = {
  query: string;
  profiles: ProfileRow[];
  events: EventRow[];
  announcements: AnnouncementRow[];
};

const ROLE_STYLE: Record<string, string> = {
  ADMIN:   "bg-amber-50  text-amber-700  ring-1 ring-inset ring-amber-200",
  SERVICE: "bg-blue-50   text-blue-700   ring-1 ring-inset ring-blue-200",
  MEMBER:  "bg-[var(--surface-2)] text-[var(--text-muted)] ring-1 ring-inset ring-[var(--border)]",
};
const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin", SERVICE: "Service", MEMBER: "Member",
};

function formatEventDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function SectionCard({
  icon: Icon,
  title,
  count,
  href,
  children,
}: {
  icon: typeof UserRound;
  title: string;
  count: number;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-[var(--text-muted)]" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">{title}</span>
        </div>
        <span className="tabular-nums text-xs text-[var(--text-muted)]">{count} found</span>
      </div>

      {/* Results */}
      <div className="flex-1 divide-y divide-[var(--border)]">{children}</div>

      {/* Footer link */}
      {count > 0 && (
        <div className="border-t border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5">
          <Link
            href={href}
            className="flex items-center gap-1 text-xs font-medium text-amber-600 no-underline transition-colors hover:text-amber-800"
          >
            View all in {title.toLowerCase()}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  body,
  actionLabel,
  actionHref,
}: {
  icon: typeof UserRound;
  title: string;
  body: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)]">
        <Icon className="h-5 w-5 text-[var(--text-muted)]" />
      </div>
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">{title}</p>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">{body}</p>
      </div>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-1 flex h-8 items-center rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 text-xs font-medium text-[var(--text-primary)] no-underline transition-colors hover:bg-[var(--surface)]"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export default function SearchResults({ query, profiles, events, announcements }: SearchResultsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {/* Members */}
      <SectionCard icon={UserRound} title="Members" count={profiles.length} href="/people">
        {profiles.length === 0 ? (
          <EmptyState
            icon={UserRound}
            title="No matching members"
            body={query ? "Try searching by email or full name." : "Start with a name or email."}
          />
        ) : (
          profiles.map((p) => {
            const name = p.full_name || p.email || "Unknown";
            const initials = name.slice(0, 2).toUpperCase();
            const role = p.role ?? "MEMBER";
            return (
              <Link
                key={p.id}
                href="/people"
                className="flex items-center gap-3 px-4 py-3 no-underline transition-colors hover:bg-[var(--surface-2)]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[11px] font-bold text-amber-700">
                  {initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">{name}</p>
                  {p.full_name && (
                    <p className="truncate text-xs text-[var(--text-muted)]">{p.email}</p>
                  )}
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${ROLE_STYLE[role] ?? ROLE_STYLE.MEMBER}`}>
                  {ROLE_LABEL[role] ?? role}
                </span>
              </Link>
            );
          })
        )}
      </SectionCard>

      {/* Events */}
      <SectionCard icon={Calendar} title="Events" count={events.length} href="/events">
        {events.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No matching events"
            body={query ? `No events found for "${query}".` : 'Try "Bible Study" or "Youth Night".'}
            actionLabel="Create event"
            actionHref="/events"
          />
        ) : (
          events.map((ev) => (
            <Link
              key={ev.id}
              href="/events"
              className="flex flex-col gap-0.5 px-4 py-3 no-underline transition-colors hover:bg-[var(--surface-2)]"
            >
              <p className="text-sm font-medium text-[var(--text-primary)]">{ev.title}</p>
              <p className="text-xs text-[var(--text-muted)]">
                {formatEventDate(ev.start_at)}
                {ev.location ? ` · ${ev.location}` : ""}
              </p>
            </Link>
          ))
        )}
      </SectionCard>

      {/* Announcements */}
      <SectionCard icon={Megaphone} title="Announcements" count={announcements.length} href="/announcements">
        {announcements.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No announcements found"
            body={query ? `No announcements match "${query}".` : "Try searching a recent title."}
            actionLabel="Post announcement"
            actionHref="/announcements"
          />
        ) : (
          announcements.map((a) => (
            <Link
              key={a.id}
              href="/announcements"
              className="flex flex-col gap-0.5 px-4 py-3 no-underline transition-colors hover:bg-[var(--surface-2)]"
            >
              <p className="text-sm font-medium text-[var(--text-primary)]">{a.title}</p>
              <p className="text-xs text-[var(--text-muted)]">
                {a.publish_at ? formatEventDate(a.publish_at) : "Draft"}
              </p>
            </Link>
          ))
        )}
      </SectionCard>
    </div>
  );
}
