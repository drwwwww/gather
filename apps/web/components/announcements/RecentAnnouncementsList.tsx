"use client";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardTitle } from "../ui/card";
import { formatRelativeTime, formatShortWeekdayDateTime } from "../../lib/format";
import AnnouncementTemplates, { type AnnouncementTemplate } from "./AnnouncementTemplates";
import type { Database } from "@gather/lib";

type Announcement = Database["public"]["Tables"]["announcements"]["Row"];

type AnnouncementStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED";

type RecentAnnouncementsListProps = {
  announcements: Announcement[];
  loading: boolean;
  onSelect: (announcement: Announcement) => void;
  onEdit: (announcement: Announcement) => void;
  onDuplicate: (announcement: Announcement) => void;
  onDeleteDraft: (announcement: Announcement) => void;
  onCancelSchedule: (announcement: Announcement) => void;
  onTemplateSelect: (template: AnnouncementTemplate) => void;
};

const statusBadge: Record<AnnouncementStatus, "default" | "success" | "warning" | "neutral"> = {
  DRAFT: "neutral",
  SCHEDULED: "warning",
  PUBLISHED: "success"
};

const audienceLabels: Record<string, string> = {
  ALL: "ALL",
  MEMBER: "MEMBER",
  SERVICE: "SERVICE",
  ADMIN: "ADMIN"
};

export default function RecentAnnouncementsList({
  announcements,
  loading,
  onSelect,
  onEdit,
  onDuplicate,
  onDeleteDraft,
  onCancelSchedule,
  onTemplateSelect
}: RecentAnnouncementsListProps) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardTitle>Recent Announcements</CardTitle>
        <span className="text-xs text-[var(--gather-muted)]">Latest activity</span>
      </div>
      <div className="mt-4 space-y-3 text-sm">
        {loading ? (
          <p className="text-[var(--gather-muted)]">Loading announcements...</p>
        ) : announcements.length === 0 ? (
          <div className="rounded-xl border border-dashed border-base-300 p-4">
            <p className="text-[var(--gather-muted)]">No announcements yet.</p>
            <p className="text-xs text-[var(--gather-muted)] mt-1">Publish a welcome announcement to get started.</p>
            <div className="mt-3">
              <AnnouncementTemplates onSelect={onTemplateSelect} />
            </div>
          </div>
        ) : (
          announcements.map((announcement) => {
            const status = deriveStatus(announcement.publish_at);
            const timeLabel = getTimeLabel(status, announcement.publish_at, announcement.created_at);
            return (
              <div
                key={announcement.id}
                role="button"
                tabIndex={0}
                className="w-full text-left rounded-2xl bg-base-100 p-4 hover:bg-base-200"
                onClick={() => onSelect(announcement)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(announcement);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-[var(--gather-ink)]">{announcement.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge variant="default">{audienceLabels[announcement.audience] ?? announcement.audience}</Badge>
                      <Badge variant={statusBadge[status]}>{status}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-[var(--gather-muted)]">{timeLabel}</p>
                  </div>
                  <div className="dropdown dropdown-end">
                    <Button size="sm" variant="outline" onClick={(event) => event.stopPropagation()}>
                      ⋮
                    </Button>
                    <ul className="dropdown-content menu rounded-box w-40 bg-base-100 p-2 shadow">
                      <li>
                        <button type="button" onClick={(event) => {
                          event.stopPropagation();
                          onEdit(announcement);
                        }}>
                          Edit
                        </button>
                      </li>
                      <li>
                        <button type="button" onClick={(event) => {
                          event.stopPropagation();
                          onDuplicate(announcement);
                        }}>
                          Duplicate
                        </button>
                      </li>
                      {status === "SCHEDULED" ? (
                        <li>
                          <button type="button" onClick={(event) => {
                            event.stopPropagation();
                            onCancelSchedule(announcement);
                          }}>
                            Cancel schedule
                          </button>
                        </li>
                      ) : null}
                      {status === "DRAFT" ? (
                        <li>
                          <button type="button" onClick={(event) => {
                            event.stopPropagation();
                            onDeleteDraft(announcement);
                          }}>
                            Delete draft
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
    </Card>
  );
}

function deriveStatus(publishAt: string | null) {
  if (!publishAt) return "DRAFT";
  const parsed = new Date(publishAt);
  return parsed > new Date() ? "SCHEDULED" : "PUBLISHED";
}

function getTimeLabel(status: AnnouncementStatus, publishAt: string | null, createdAt: string) {
  if (status === "DRAFT") {
    return `Saved ${formatRelativeTime(createdAt)}`;
  }
  if (status === "SCHEDULED" && publishAt) {
    return `Scheduled for ${formatShortWeekdayDateTime(publishAt)}`;
  }
  if (publishAt) {
    return `Published ${formatRelativeTime(publishAt)}`;
  }
  return "";
}
