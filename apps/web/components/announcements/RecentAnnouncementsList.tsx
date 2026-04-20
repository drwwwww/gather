"use client";

import { useEffect, useState } from "react";
import { formatRelativeTime, formatShortWeekdayDateTime } from "../../lib/format";
import AnnouncementTemplates, { type AnnouncementTemplate } from "./AnnouncementTemplates";
import { Megaphone } from "lucide-react";
import type { Database } from "@gather/lib";
import Badge from "../ui/Badge";
import Loader from "../ui/Loader";

type Announcement = Database["public"]["Tables"]["announcements"]["Row"];

type AnnouncementStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED";

type RecentAnnouncementsListProps = {
  announcements: Announcement[];
  loading: boolean;
  /** Subtle refresh indicator when list already has rows (does not replace list). */
  listRefreshing?: boolean;
  onSelect: (announcement: Announcement) => void;
  onEdit: (announcement: Announcement) => void;
  onDuplicate: (announcement: Announcement) => void;
  onDelete: (announcement: Announcement) => void;
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
  listRefreshing = false,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
  onCancelSchedule,
  onTemplateSelect
}: RecentAnnouncementsListProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (!openMenuId) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Keep menu open when clicking inside the action button/menu.
      if (target.closest("[data-announcement-action-menu='true']")) return;
      if (target.closest("[data-announcement-action-button='true']")) return;
      setOpenMenuId(null);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openMenuId]);

  return (
    <div className="card shadow-sm p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="card-title">Recent Announcements</div>
        <div className="flex items-center gap-2">
          {listRefreshing && announcements.length > 0 ? (
            <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]" aria-live="polite">
              <span
                className="inline-block h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent opacity-80"
                aria-hidden
              />
              Updating…
            </span>
          ) : (
            <span className="text-xs text-[var(--text-muted)]">Latest activity</span>
          )}
        </div>
      </div>
      <div className={`mt-4 space-y-3 text-sm ${listRefreshing && announcements.length > 0 ? "opacity-70 transition-opacity" : ""}`}>
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-6">
            <Loader />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading announcements...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-8 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)]">
              <Megaphone className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>No announcements yet</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Publish a welcome announcement to get started.</p>
            </div>
            <div className="mt-3 w-full max-w-md">
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
                className="w-full text-left rounded-2xl bg-[var(--surface)] p-4 hover:bg-[var(--surface-2)]"
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
                    <p className="font-medium text-[var(--text-primary)]">{announcement.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge variant="neutral">{audienceLabels[announcement.audience] ?? announcement.audience}</Badge>
                      <Badge variant={statusBadge[status]}>{status}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-[var(--text-muted)]">{timeLabel}</p>
                  </div>
                  <div className="relative inline-block">
                    <button
                      type="button"
                      data-announcement-action-button="true"
                      className="btn btn-ghost btn-sm btn-square"
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenMenuId((id) => (id === announcement.id ? null : announcement.id));
                      }}
                      aria-haspopup="menu"
                      aria-expanded={openMenuId === announcement.id}
                    >
                      ⋮
                    </button>
                    {openMenuId === announcement.id ? (
                      <ul
                        data-announcement-action-menu="true"
                        className="dropdown-menu absolute right-0 top-full mt-2 flex w-40 flex-col gap-0.5 p-2"
                        role="menu"
                      >
                        <li role="none" className="list-none">
                          <button
                            type="button"
                            role="menuitem"
                            className="dropdown-menu-item"
                            onClick={(event) => {
                              event.stopPropagation();
                              onEdit(announcement);
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
                            onClick={(event) => {
                              event.stopPropagation();
                              onDuplicate(announcement);
                              setOpenMenuId(null);
                            }}
                          >
                            Duplicate
                          </button>
                        </li>
                        {status === "SCHEDULED" ? (
                          <li role="none" className="list-none">
                            <button
                              type="button"
                              role="menuitem"
                              className="dropdown-menu-item"
                              onClick={(event) => {
                                event.stopPropagation();
                                onCancelSchedule(announcement);
                                setOpenMenuId(null);
                              }}
                            >
                              Cancel schedule
                            </button>
                          </li>
                        ) : null}
                        <li role="none" className="list-none">
                          <button
                            type="button"
                            role="menuitem"
                            className="dropdown-menu-item text-error"
                            onClick={(event) => {
                              event.stopPropagation();
                              onDelete(announcement);
                              setOpenMenuId(null);
                            }}
                          >
                            Delete
                          </button>
                        </li>
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
