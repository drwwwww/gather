"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { MapPin, Users, MoreHorizontal, Calendar, Search, X } from "lucide-react";
import EventTemplates, { type EventTemplate } from "./EventTemplates";
import type { Database } from "@gather/lib";

type EventItem = Database["public"]["Tables"]["events"]["Row"];
export type EventListTab = "UPCOMING" | "PAST" | "CANCELLED";

const AUDIENCE_LABELS: Record<string, string> = {
  ALL: "All members",
  MEMBER: "Members",
  SERVICE: "Service team",
  ADMIN: "Admins",
};

type EventsListProps = {
  upcoming: EventItem[];
  past: EventItem[];
  cancelled: EventItem[];
  selectedEventId: string | null;
  activeTab: EventListTab;
  rsvpCounts: Record<string, number>;
  onTabChange: (tab: EventListTab) => void;
  onSelect: (event: EventItem) => void;
  onEdit: (event: EventItem) => void;
  onDuplicate: (event: EventItem) => void;
  onCancel: (event: EventItem) => void;
  onRestore: (event: EventItem) => void;
  onTemplateSelect: (template: EventTemplate) => void;
};

function formatDateRange(startAt: string, endAt: string | null, allDay: boolean) {
  const start = new Date(startAt);
  if (!endAt) {
    if (allDay) return format(start, "EEE, MMM d, yyyy");
    return format(start, "EEE, MMM d · h:mm a");
  }
  const end = new Date(endAt);
  const sameDay = start.toDateString() === end.toDateString();
  if (allDay) {
    return sameDay
      ? format(start, "EEE, MMM d, yyyy")
      : `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
  }
  return sameDay
    ? `${format(start, "EEE, MMM d · h:mm")}–${format(end, "h:mm a")}`
    : `${format(start, "MMM d, h:mm a")} – ${format(end, "MMM d, h:mm a")}`;
}

export default function EventsList({
  upcoming, past, cancelled, selectedEventId, activeTab, rsvpCounts,
  onTabChange, onSelect, onEdit, onDuplicate, onCancel, onRestore, onTemplateSelect,
}: EventsListProps) {
  const [search, setSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!openMenuId) return;
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenuId(null); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [openMenuId]);

  const rawList = activeTab === "UPCOMING" ? upcoming : activeTab === "PAST" ? past : cancelled;
  const list = search.trim()
    ? rawList.filter(e => `${e.title} ${e.location ?? ""}`.toLowerCase().includes(search.toLowerCase()))
    : rawList;

  const TABS: { value: EventListTab; label: string; count: number }[] = [
    { value: "UPCOMING",  label: "Upcoming",  count: upcoming.length },
    { value: "PAST",      label: "Past",      count: past.length },
    { value: "CANCELLED", label: "Cancelled", count: cancelled.length },
  ];

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-1">
          {TABS.map(tab => (
            <button key={tab.value} type="button" onClick={() => onTabChange(tab.value)}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${activeTab === tab.value ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
            >
              {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${activeTab === tab.value ? "bg-amber-100 text-amber-700" : "bg-[var(--surface)] text-[var(--text-muted)]"}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-[var(--text-muted)]" />
          <input type="text" placeholder="Search events…" value={search} onChange={e => setSearch(e.target.value)}
            className="h-9 rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-9 pr-9 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100 w-48"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="absolute right-3 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {list.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-2)]">
              <Calendar className="h-6 w-6 text-[var(--text-muted)]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {search ? "No events match your search" : activeTab === "UPCOMING" ? "No upcoming events" : activeTab === "PAST" ? "No past events" : "No cancelled events"}
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {search ? "Try a different search term." : activeTab === "UPCOMING" ? 'Use the "New Event" button to get started.' : activeTab === "CANCELLED" ? "Cancelled events can be restored from this view." : ""}
              </p>
            </div>
            {!search && activeTab === "UPCOMING" && (
              <div className="w-full max-w-md">
                <EventTemplates onSelect={onTemplateSelect} />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          {list.map((event, idx) => {
            const isSelected = event.id === selectedEventId;
            const rsvpCount = rsvpCounts[event.id] ?? 0;
            const start = new Date(event.start_at);
            const dateRange = formatDateRange(event.start_at, event.end_at, false);
            const isMenuOpen = openMenuId === event.id;

            return (
              <div
                key={event.id}
                className={`group relative flex items-center gap-4 border-b border-[var(--border)] px-5 py-4 last:border-0 transition-colors ${isSelected ? "bg-amber-50" : "hover:bg-[var(--surface-container-low)]"} ${event.is_cancelled ? "opacity-60" : ""}`}
              >
                {/* Selected indicator */}
                {isSelected && <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl bg-amber-400" />}

                {/* Date chip / image thumbnail */}
                {(event as any).image_url ? (
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[var(--border)]">
                    <img src={(event as any).image_url} alt="" className="h-full w-full object-cover" />
                  </div>
                ) : (
                <div className={`flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-xl text-center transition-colors ${isSelected ? "bg-amber-500 text-white" : "bg-[var(--surface-container-low)] text-[var(--text-primary)] group-hover:bg-amber-100"}`}>
                  <span className={`text-[9px] font-bold uppercase leading-none ${isSelected ? "text-white/80" : "text-[var(--text-muted)]"}`}>
                    {format(start, "MMM")}
                  </span>
                  <span className="text-lg font-black leading-tight tabular-nums">
                    {format(start, "d")}
                  </span>
                </div>
                )}

                {/* Content */}
                <button type="button" onClick={() => onSelect(event)} className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left focus:outline-none">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`text-sm font-semibold ${isSelected ? "text-amber-900" : "text-[var(--text-primary)]"} ${event.is_cancelled ? "line-through" : ""}`}>
                      {event.title}
                    </p>
                    {event.is_cancelled && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-600">Cancelled</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[var(--text-muted)]">
                    <span>{dateRange}</span>
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {event.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3 shrink-0" />
                      {AUDIENCE_LABELS[event.audience] ?? event.audience}
                    </span>
                  </div>
                </button>

                {/* RSVP count */}
                {(() => {
                  const isPast = new Date(event.start_at) < new Date();
                  const word = isPast ? "attended" : "going";
                  return (
                    <div className="shrink-0">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${rsvpCount > 0 ? "bg-green-50 text-green-700" : "bg-[var(--surface-2)] text-[var(--text-muted)]"}`}>
                        {rsvpCount} {word}
                      </span>
                    </div>
                  );
                })()}

                {/* Actions menu */}
                <div className="relative shrink-0" ref={isMenuOpen ? menuRef : null}>
                  <button type="button"
                    onClick={e => { e.stopPropagation(); setOpenMenuId(id => id === event.id ? null : event.id); }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  {isMenuOpen && (
                    <ul className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-lg" role="menu">
                      <li className="list-none">
                        <button type="button" role="menuitem" onClick={e => { e.stopPropagation(); onEdit(event); setOpenMenuId(null); }}
                          className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-2)]">
                          Edit event
                        </button>
                      </li>
                      <li className="list-none">
                        <button type="button" role="menuitem" onClick={e => { e.stopPropagation(); onDuplicate(event); setOpenMenuId(null); }}
                          className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-2)]">
                          Duplicate
                        </button>
                      </li>
                      {event.is_cancelled ? (
                        <li className="list-none">
                          <button type="button" role="menuitem" onClick={e => { e.stopPropagation(); onRestore(event); setOpenMenuId(null); }}
                            className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-green-600 transition-colors hover:bg-green-50">
                            Restore event
                          </button>
                        </li>
                      ) : (
                        <li className="list-none">
                          <button type="button" role="menuitem" onClick={e => { e.stopPropagation(); onCancel(event); setOpenMenuId(null); }}
                            className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-red-500 transition-colors hover:bg-red-50">
                            Cancel event
                          </button>
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export type { EventListTab as EventListTabType };
