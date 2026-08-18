"use client";

import { useState } from "react";
import { formatRelativeTime, formatShortWeekdayDateTime } from "../../lib/format";
import AnnouncementTemplates, { type AnnouncementTemplate } from "./AnnouncementTemplates";
import { Megaphone } from "lucide-react";
import type { Database } from "@gather/lib";
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

const audienceLabels: Record<string, string> = {
  ALL: "All Members",
  MEMBER: "Members",
  SERVICE: "Service Team",
  ADMIN: "Admins"
};

export default function RecentAnnouncementsList({
  announcements,
  loading,
  listRefreshing = false,
  onEdit,
  onDelete,
  onCancelSchedule,
  onTemplateSelect
}: RecentAnnouncementsListProps) {

  return (
    <div className={`space-y-4 ${listRefreshing && announcements.length > 0 ? "opacity-70 transition-opacity" : ""}`}>
      {listRefreshing && announcements.length > 0 ? (
        <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]" aria-live="polite">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
          Updating…
        </span>
      ) : null}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <Loader />
          <p className="text-sm text-[var(--text-muted)]">Loading announcements...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-2)]">
            <Megaphone className="h-5 w-5 text-[var(--text-muted)]" />
          </div>
          <div>
            <p className="font-medium text-[var(--text-primary)]">Nothing here yet</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Use "New Announcement" to get started.</p>
          </div>
          <div className="mt-2 w-full max-w-md">
            <AnnouncementTemplates onSelect={onTemplateSelect} />
          </div>
        </div>
      ) : (
        announcements.map((announcement) => {
          const status = deriveStatus(announcement.publish_at);
          const timeLabel = getTimeLabel(status, announcement.publish_at, announcement.created_at);
          const isDraft = status === "DRAFT";
          return (
            <div
              key={announcement.id}
              className={`group overflow-hidden rounded-2xl transition-all duration-200 hover:shadow-md ${
                isDraft
                  ? "border-2 border-dashed border-[var(--primary-soft)] bg-[var(--primary-soft)]"
                  : "border border-[var(--border)] bg-[var(--surface)]"
              }`}
            >
              {/* Banner image */}
              {(announcement as any).image_url && (
                <div className="h-36 w-full overflow-hidden">
                  <img src={(announcement as any).image_url} alt="" className="h-full w-full object-cover" />
                </div>
              )}
              <div className="flex items-start gap-6 p-6">
              {/* Content */}
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    {audienceLabels[announcement.audience] ?? announcement.audience}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">· {timeLabel}</span>
                </div>
                <h3 className="truncate text-lg font-bold text-[var(--text-primary)]">{announcement.title}</h3>
                {announcement.body ? (
                  <p className="line-clamp-2 text-sm leading-relaxed text-[var(--text-secondary)]">{announcement.body}</p>
                ) : null}
                <div className="flex items-center gap-5 pt-1">
                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--nav-active-foreground)]"
                    onClick={(e) => { e.stopPropagation(); onEdit(announcement); }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                    </svg>
                    {isDraft ? "Resume Editing" : "Edit"}
                  </button>
                  {isDraft ? (
                    <button
                      type="button"
                      className="flex items-center gap-1 text-xs font-semibold text-[var(--nav-active-foreground)] transition-colors hover:text-[var(--primary)]"
                      onClick={(e) => { e.stopPropagation(); onEdit(announcement); }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                      </svg>
                      Publish Now
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="flex items-center gap-1 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--danger)]"
                      onClick={(e) => { e.stopPropagation(); onDelete(announcement); }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                      Delete
                    </button>
                  )}
                  {status === "SCHEDULED" ? (
                    <button
                      type="button"
                      className="flex items-center gap-1 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                      onClick={(e) => { e.stopPropagation(); onCancelSchedule(announcement); }}
                    >
                      Cancel schedule
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Status badge */}
              <div className="flex shrink-0 flex-col items-end gap-2 pt-0.5">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                    status === "PUBLISHED"
                      ? "bg-green-50 text-green-700 ring-green-200"
                      : status === "SCHEDULED"
                        ? "bg-amber-50 text-amber-700 ring-amber-200"
                        : "bg-slate-100 text-slate-500 ring-slate-200"
                  }`}
                >
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                </span>
              </div>
              </div>
            </div>
          );
        })
      )}
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
