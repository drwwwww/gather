"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarX2, Copy, Megaphone, Pencil, Trash2 } from "lucide-react";
import type { Database } from "@gather/lib";
import { formatRelativeTime, formatShortWeekdayDateTime } from "../../lib/format";
import AnnouncementTemplates, { type AnnouncementTemplate } from "./AnnouncementTemplates";

type Announcement = Database["public"]["Tables"]["announcements"]["Row"];
type Status = "DRAFT" | "SCHEDULED" | "PUBLISHED";

const audienceLabels: Record<string, string> = {
  ALL: "Everyone",
  MEMBER: "Members + service team",
  SERVICE: "Service team",
  ADMIN: "Admins",
  MINISTRY: "A ministry",
};

const statusOf = (a: Announcement): Status => {
  if (!a.publish_at) return "DRAFT";
  return new Date(a.publish_at) > new Date() ? "SCHEDULED" : "PUBLISHED";
};

const timeLabel = (a: Announcement, status: Status) => {
  if (status === "DRAFT") return `Saved ${formatRelativeTime(a.created_at)}`;
  if (status === "SCHEDULED" && a.publish_at) return `Goes out ${formatShortWeekdayDateTime(a.publish_at)}`;
  return a.publish_at ? `Published ${formatRelativeTime(a.publish_at)}` : "";
};

const STATUS_PILL: Record<Status, string> = {
  PUBLISHED: "bg-green-50 text-green-700 ring-green-200",
  SCHEDULED: "bg-amber-50 text-amber-800 ring-amber-200",
  DRAFT: "bg-[var(--surface-2)] text-[var(--text-secondary)] ring-[var(--border)]",
};
const STATUS_WORD: Record<Status, string> = { PUBLISHED: "Live", SCHEDULED: "Scheduled", DRAFT: "Draft" };

/**
 * Announcements as a list + phone preview (Mailchimp campaigns / Gmail / Linear
 * inbox): scan many posts on the left, see the selected one exactly as members
 * get it in the app on the right, with its actions beside it.
 */
export default function AnnouncementBrowser({
  announcements,
  listRefreshing = false,
  onEdit,
  onDuplicate,
  onDelete,
  onCancelSchedule,
  onTemplateSelect,
}: {
  announcements: Announcement[];
  listRefreshing?: boolean;
  onEdit: (a: Announcement) => void;
  onDuplicate: (a: Announcement) => void;
  onDelete: (a: Announcement) => void;
  onCancelSchedule: (a: Announcement) => void;
  onTemplateSelect: (template: AnnouncementTemplate) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(announcements[0]?.id ?? null);

  // Keep a valid selection when the tab or list changes.
  useEffect(() => {
    if (!announcements.some((a) => a.id === selectedId)) setSelectedId(announcements[0]?.id ?? null);
  }, [announcements, selectedId]);

  const selected = useMemo(() => announcements.find((a) => a.id === selectedId) ?? null, [announcements, selectedId]);

  if (announcements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-2)]">
          <Megaphone className="h-5 w-5 text-[var(--text-muted)]" aria-hidden />
        </span>
        <p className="font-medium text-[var(--text-primary)]">Nothing here yet</p>
        <div className="mt-2 w-full max-w-md">
          <AnnouncementTemplates onSelect={onTemplateSelect} />
        </div>
      </div>
    );
  }

  const status = selected ? statusOf(selected) : null;
  const imageUrl = (selected as (Announcement & { image_url?: string | null }) | null)?.image_url ?? null;

  return (
    <div className={`grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px] ${listRefreshing ? "opacity-70 transition-opacity" : ""}`}>
      {/* List */}
      <ul className="m-0 list-none divide-y divide-[var(--divider)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-0">
        {announcements.map((a) => {
          const st = statusOf(a);
          const isSelected = a.id === selectedId;
          const thumb = (a as Announcement & { image_url?: string | null }).image_url;
          return (
            <li key={a.id} className="list-none">
              <button
                type="button"
                onClick={() => setSelectedId(a.id)}
                onDoubleClick={() => onEdit(a)}
                aria-pressed={isSelected}
                className={`flex w-full items-center gap-4 px-4 py-3 text-left transition-colors ${
                  isSelected ? "bg-amber-50/60" : "hover:bg-[var(--surface-2)]"
                }`}
              >
                <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-[var(--surface-2)]">
                  {thumb ? (
                    <img src={thumb} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Megaphone className="absolute inset-0 m-auto h-4 w-4 text-[var(--text-muted)]" aria-hidden />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{a.title || "Untitled"}</span>
                  <span className="block truncate text-xs text-[var(--text-muted)]">
                    {audienceLabels[a.audience] ?? a.audience} · {timeLabel(a, st)}
                  </span>
                </span>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${STATUS_PILL[st]}`}>
                  {STATUS_WORD[st]}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Phone preview + actions */}
      {selected && status ? (
        <aside className="lg:sticky lg:top-6" aria-label="Preview">
          <p className="mb-2 text-center text-xs text-[var(--text-muted)]">
            How {selected.audience === "ALL" ? "everyone" : (audienceLabels[selected.audience] ?? "members").toLowerCase()} see it in the app
          </p>
          <div className="mx-auto w-full max-w-[340px] rounded-[36px] border border-[var(--border)] bg-[var(--surface-2)] p-2.5 shadow-[0_20px_40px_-24px_rgba(40,30,10,0.45)]">
            <div className="overflow-hidden rounded-[28px] bg-[#F6F4EF]">
              <div className="relative h-40 bg-[var(--surface-2)]">
                {imageUrl ? (
                  <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-xs text-[var(--text-muted)]">
                    <Megaphone className="h-5 w-5" aria-hidden />
                    The app adds a church photo
                  </span>
                )}
              </div>
              <div className="max-h-[320px] overflow-y-auto px-4 pb-5 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700">Announcement</p>
                <h3 className="mt-1 text-lg font-semibold leading-snug text-[#1F1B14]">{selected.title || "Untitled"}</h3>
                <p className="mt-1 text-xs text-[#6B6255]">{timeLabel(selected, status)}</p>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[#3D3529]">{selected.body}</p>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-4 flex max-w-[340px] flex-wrap justify-center gap-2">
            <button type="button" onClick={() => onEdit(selected)} className="btn btn-primary h-9 gap-1.5 px-4 text-sm">
              <Pencil className="h-3.5 w-3.5" aria-hidden /> {status === "DRAFT" ? "Finish and publish" : "Edit"}
            </button>
            <button type="button" onClick={() => onDuplicate(selected)} className="btn btn-secondary h-9 gap-1.5 px-3 text-sm">
              <Copy className="h-3.5 w-3.5" aria-hidden /> Duplicate
            </button>
            {status === "SCHEDULED" ? (
              <button type="button" onClick={() => onCancelSchedule(selected)} className="btn btn-secondary h-9 gap-1.5 px-3 text-sm">
                <CalendarX2 className="h-3.5 w-3.5" aria-hidden /> Don&apos;t send
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onDelete(selected)}
              className="btn btn-ghost h-9 gap-1.5 px-3 text-sm text-[var(--text-secondary)] hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete
            </button>
          </div>
        </aside>
      ) : null}
    </div>
  );
}
