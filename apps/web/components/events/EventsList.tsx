"use client";

import { useEffect, useRef, useState } from "react";
import { formatShortWeekdayDateTime } from "../../lib/format";
import EventTemplates, { type EventTemplate } from "./EventTemplates";
import { Calendar } from "lucide-react";
import type { Database } from "@gather/lib";
import { Button } from "../ui/button";
import Badge from "../ui/Badge";

type EventItem = Database["public"]["Tables"]["events"]["Row"];

type EventListTab = "UPCOMING" | "PAST";

type EventsListProps = {
  upcoming: EventItem[];
  past: EventItem[];
  selectedEventId: string | null;
  activeTab: EventListTab;
  rsvpCounts: Record<string, number>;
  onTabChange: (tab: EventListTab) => void;
  onSelect: (event: EventItem) => void;
  onEdit: (event: EventItem) => void;
  onDuplicate: (event: EventItem) => void;
  onCancel: (event: EventItem) => void;
  onTemplateSelect: (template: EventTemplate) => void;
};

const audienceLabels: Record<string, string> = {
  ALL: "ALL",
  MEMBER: "MEMBER",
  SERVICE: "SERVICE",
  ADMIN: "ADMIN"
};

export default function EventsList({
  upcoming,
  past,
  selectedEventId,
  activeTab,
  rsvpCounts,
  onTabChange,
  onSelect,
  onEdit,
  onDuplicate,
  onCancel,
  onTemplateSelect
}: EventsListProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!openMenuId) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openMenuId]);

  const list = activeTab === "UPCOMING" ? upcoming : past;

  return (
    <div className="card card-elevated p-4">
      <div className="flex items-center justify-between">
        <div className="card-title">Events</div>
        <div className="flex items-center gap-2">
            <button
              type="button"
              className={`btn btn-sm rounded-full ${activeTab === "UPCOMING" ? "btn-primary-gradient" : "btn-outline-amber"}`}
              onClick={() => onTabChange("UPCOMING")}
            >
              Upcoming
            </button>
            <button
              type="button"
              className={`btn btn-sm rounded-full ${activeTab === "PAST" ? "btn-primary-gradient" : "btn-outline-amber"}`}
              onClick={() => onTabChange("PAST")}
            >
              Past
            </button>
        </div>
      </div>

      <div className="mt-4 space-y-3 text-sm">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-8 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)]">
              <Calendar className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>No events scheduled yet</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Create your first event using a template below.</p>
            </div>
            <div className="mt-3 w-full max-w-md">
              <EventTemplates onSelect={onTemplateSelect} />
            </div>
          </div>
        ) : (
          list.map((event) => {
            const isSelected = event.id === selectedEventId;
            const rsvpCount = rsvpCounts[event.id] ?? 0;
            return (
              <div
                key={event.id}
                role="button"
                tabIndex={0}
                className={`rounded-2xl p-4 ${isSelected ? "bg-primary/10" : "bg-[var(--surface)] hover:bg-[var(--surface-2)]"}`}
                onClick={() => onSelect(event)}
                onKeyDown={(evt) => {
                  if (evt.key === "Enter" || evt.key === " ") {
                    evt.preventDefault();
                    onSelect(event);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">
                      {event.title}
                      {event.is_cancelled ? " (Cancelled)" : ""}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {formatShortWeekdayDateTime(event.start_at)}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge>{audienceLabels[event.audience] ?? event.audience}</Badge>
                      <Badge variant="neutral">{rsvpCount} going</Badge>
                      {event.is_cancelled ? <Badge variant="warning">CANCELLED</Badge> : null}
                    </div>
                  </div>
                  <div className="relative" ref={menuRef}>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="btn-icon"
                      onClick={(evt) => {
                        evt.stopPropagation();
                        setOpenMenuId((id) => (id === event.id ? null : event.id));
                      }}
                      aria-haspopup="menu"
                      aria-expanded={openMenuId === event.id}
                    >
                      ⋮
                    </Button>
                    {openMenuId === event.id ? (
                      <ul
                        className="dropdown-menu absolute right-0 top-full mt-2 flex w-40 flex-col gap-0.5 p-2"
                        role="menu"
                      >
                        <li role="none" className="list-none">
                          <button
                            type="button"
                            role="menuitem"
                            className="dropdown-menu-item"
                            onClick={(evt) => {
                              evt.stopPropagation();
                              onEdit(event);
                              setOpenMenuId(null);
                            }}
                          >
                            Edit
                          </button>
                        </li>
                        <li role="none" className="list-none">
                          <button
                            type="button"
                            role="menuitem"
                            className="dropdown-menu-item"
                            onClick={(evt) => {
                              evt.stopPropagation();
                              onDuplicate(event);
                              setOpenMenuId(null);
                            }}
                          >
                            Duplicate
                          </button>
                        </li>
                        {!event.is_cancelled ? (
                          <li role="none" className="list-none">
                            <button
                              type="button"
                              role="menuitem"
                              className="dropdown-menu-item"
                              onClick={(evt) => {
                                evt.stopPropagation();
                                onCancel(event);
                                setOpenMenuId(null);
                              }}
                            >
                              Cancel event
                            </button>
                          </li>
                        ) : null}
                      </ul>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export type { EventListTab };
