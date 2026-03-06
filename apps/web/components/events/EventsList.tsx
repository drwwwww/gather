"use client";

// ...existing code...
import { formatShortWeekdayDateTime } from "../../lib/format";
import EventTemplates, { type EventTemplate } from "./EventTemplates";
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
  const list = activeTab === "UPCOMING" ? upcoming : past;

  return (
    <div className="card bg-base-100 shadow-md p-4 rounded-xl">
      <div className="flex items-center justify-between">
        <div className="card-title text-lg font-semibold">Events</div>
        <div className="flex items-center gap-2">
            <button
              type="button"
              className={`btn btn-sm ${activeTab === "UPCOMING" ? "btn-primary" : "btn-outline"}`}
              onClick={() => onTabChange("UPCOMING")}
            >
              Upcoming
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === "PAST" ? "btn-primary" : "btn-outline"}`}
              onClick={() => onTabChange("PAST")}
            >
              Past
            </button>
        </div>
      </div>

      <div className="mt-4 space-y-3 text-sm">
        {list.length === 0 ? (
          <div className="rounded-xl border border-dashed border-base-300 p-4">
            <p className="text-[var(--gather-muted)]">No events scheduled yet.</p>
            <p className="text-xs text-[var(--gather-muted)] mt-1">Create your first event.</p>
            <div className="mt-3">
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
                className={`rounded-2xl p-4 ${isSelected ? "bg-primary/10" : "bg-base-100 hover:bg-base-200"}`}
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
                    <p className="font-medium text-[var(--gather-ink)]">
                      {event.title}
                      {event.is_cancelled ? " (Cancelled)" : ""}
                    </p>
                    <p className="mt-1 text-xs text-[var(--gather-muted)]">
                      {formatShortWeekdayDateTime(event.start_at)}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge>{audienceLabels[event.audience] ?? event.audience}</Badge>
                      <Badge variant="neutral">{rsvpCount} going</Badge>
                      {event.is_cancelled ? <Badge variant="warning">CANCELLED</Badge> : null}
                    </div>
                  </div>
                  <div className="dropdown dropdown-end">
                    <Button size="sm" variant="secondary" onClick={(evt) => evt.stopPropagation()}>
                      ⋮
                    </Button>
                    <ul className="dropdown-content menu rounded-box w-40 bg-base-100 p-2 shadow">
                      <li>
                        <button type="button" onClick={(evt) => {
                          evt.stopPropagation();
                          onEdit(event);
                        }}>
                          Edit
                        </button>
                      </li>
                      <li>
                        <button type="button" onClick={(evt) => {
                          evt.stopPropagation();
                          onDuplicate(event);
                        }}>
                          Duplicate
                        </button>
                      </li>
                      {!event.is_cancelled ? (
                        <li>
                          <button type="button" onClick={(evt) => {
                            evt.stopPropagation();
                            onCancel(event);
                          }}>
                            Cancel event
                          </button>
                        </li>
                      ) : null}
                    </ul>
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
