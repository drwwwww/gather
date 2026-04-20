"use client";

import Link from "next/link";
import { Calendar, Megaphone, UserRound } from "lucide-react";
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

export default function SearchResults({ query, profiles, events, announcements }: SearchResultsProps) {
  return (
    <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
      <div className="card shadow-sm p-4 h-full">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between">
            <div className="card-title">Members</div>
            <span className="text-xs text-[var(--text-muted)]">{profiles.length} found</span>
          </div>

          <div className="mt-4 flex-1 space-y-3 text-sm">
            {profiles.length === 0 ? (
              <EmptyState
                icon={UserRound}
                title="No matching members"
                body={query ? "Try searching by email or full name." : "Start with a name or email."}
              />
            ) : (
              profiles.map((profile) => (
                <div key={profile.id} className="flex items-center justify-between rounded-lg bg-[var(--surface)] p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {(profile.full_name || profile.email || "?").slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">{profile.full_name || profile.email}</p>
                      <p className="text-xs text-[var(--text-muted)]">{profile.email}</p>
                    </div>
                  </div>
                  <span className="badge badge-outline text-xs">{profile.role}</span>
                </div>
              ))
            )}
          </div>

          {profiles.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/people" className="btn btn-outline btn-sm">
                View Profile
              </Link>
              <Link href="/people" className="btn btn-ghost btn-sm">
                Assign Role
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      <div className="card shadow-sm p-4 h-full">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between">
            <div className="card-title">Events</div>
            <span className="text-xs text-[var(--text-muted)]">{events.length} found</span>
          </div>

          <div className="mt-4 flex-1 space-y-3 text-sm">
            {events.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No matching events"
                body='Try searching "Bible Study" or "Youth Night".'
                actionLabel="Create Event"
                actionHref="/events"
              />
            ) : (
              events.map((event) => (
                <div key={event.id} className="rounded-lg bg-[var(--surface)] p-3">
                  <p className="font-semibold text-[var(--text-primary)]">{event.title}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {event.start_at ? new Date(event.start_at).toLocaleString() : ""}
                    {event.location ? ` - ${event.location}` : ""}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="card shadow-sm p-4 h-full">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between">
            <div className="card-title">Announcements</div>
            <span className="text-xs text-[var(--text-muted)]">{announcements.length} found</span>
          </div>

          <div className="mt-4 flex-1 space-y-3 text-sm">
            {announcements.length === 0 ? (
              <EmptyState
                icon={Megaphone}
                title="No announcements found"
                body="Try searching recent titles."
                actionLabel="Post Announcement"
                actionHref="/announcements"
              />
            ) : (
              announcements.map((announcement) => (
                <div key={announcement.id} className="rounded-lg bg-[var(--surface)] p-3">
                  <p className="font-semibold text-[var(--text-primary)]">{announcement.title}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {announcement.publish_at ? new Date(announcement.publish_at).toLocaleString() : "Draft"}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  body,
  actionLabel,
  actionHref
}: {
  icon: typeof UserRound;
  title: string;
  body: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] p-6 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)]">
        <Icon className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
      </div>
      <div>
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{title}</p>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{body}</p>
      </div>
      {actionLabel && actionHref ? (
        <Link href={actionHref} className="btn btn-outline btn-sm mt-2">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
