"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarX2, ChevronLeft, Church, Copy, HandHeart, MapPin, Megaphone, Pencil, Pin, Share, Star, Trash2 } from "lucide-react";
import type { Database } from "@gather/lib";
import { formatRelativeTime, formatShortWeekdayDateTime } from "../../lib/format";
import { getCurrentContext } from "../../lib/supabaseData";
import { supabase } from "../../lib/supabaseClient";
import { KIND_META, type AnnouncementKind } from "../../lib/announcements";
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
                <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg" style={{ background: KIND_META[((a as { kind?: AnnouncementKind }).kind ?? "UPDATE")].area.tint }}>
                  {thumb ? (
                    <img src={thumb} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Megaphone className="absolute inset-0 m-auto h-4 w-4" style={{ color: KIND_META[((a as { kind?: AnnouncementKind }).kind ?? "UPDATE")].area.ink }} aria-hidden />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{a.title || "Untitled"}</span>
                  <span className="block truncate text-xs text-[var(--text-muted)]">
                    {KIND_META[((a as { kind?: AnnouncementKind }).kind ?? "UPDATE")].label} · {audienceLabels[a.audience] ?? a.audience} · {timeLabel(a, st)}
                  </span>
                </span>
                {(a as { important?: boolean }).important ? <Star className="h-4 w-4 shrink-0 text-amber-600" aria-label="Important" /> : (a as { pinned?: boolean }).pinned ? <Pin className="h-4 w-4 shrink-0 text-[var(--text-muted)]" aria-label="Pinned" /> : null}
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${STATUS_PILL[st]}`}>
                  {STATUS_WORD[st]}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* In-app preview + actions */}
      {selected && status ? (
        <aside className="lg:sticky lg:top-6" aria-label="Preview">
          <AppAnnouncementPreview announcement={selected} status={status} />

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

/* ─────────────────────────── In-app preview ───────────────────────────
   The announcement exactly as the mobile app shows it (AnnouncementsDetailScreen):
   full-bleed 3:2 photo with floating back + share, then on white the type tag and
   date, the title, the church byline, and per type: the event's date/place rows
   and "I'm going" bar, sign-up slots, the "I'm praying" button. Then "Know before
   you go" and who to ask. No photo → the same brand art the app draws (BrandArt: same
   colours, same hash). Keep in step with the app. */

// Mirrors apps/mobile/src/components/app/BrandArt.tsx: same colours, same hash.
const BRAND_ART_COLORS = [
  { bg: "#6B2F6A", glow: "#A0529F" },
  { bg: "#0B5E57", glow: "#009B90" },
  { bg: "#8A3A12", glow: "#D46A2E" },
  { bg: "#1E447F", glow: "#3466B8" },
  { bg: "#7A4508", glow: "#F59E0B" },
  { bg: "#44591A", glow: "#6E8F2E" },
] as const;

function AppBrandArt({ seed }: { seed: string }) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const c = BRAND_ART_COLORS[h % BRAND_ART_COLORS.length];
  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: c.bg }} aria-hidden>
      <span className="absolute aspect-square w-[75%] rounded-full opacity-55" style={{ background: c.glow, right: "-14%", top: "-30%" }} />
      <span className="absolute inset-0 flex items-center justify-end pr-[11%]">
        <img src="/brand/mark-white.png" alt="" className="h-[40%] w-auto opacity-90" />
      </span>
    </div>
  );
}

type PreviewData = {
  church: string | null;
  event: { title: string; start_at: string; end_at: string | null; location: string | null; address: string | null } | null;
  going: number;
  slots: { id: string; label: string; detail: string | null; capacity: number; taken: number }[];
  praying: number;
  contact: { name: string; role: string } | null;
};

const clockOf = (d: Date) => d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
const roleWord = (role: string) => (role === "ADMIN" ? "Church staff" : role === "SERVICE" ? "Service team" : "Member");

function AppAnnouncementPreview({ announcement, status }: { announcement: Announcement; status: Status }) {
  const a = announcement as Announcement & {
    image_url?: string | null; kind?: AnnouncementKind; important?: boolean; event_id?: string | null;
    contact_user_id?: string | null; closes_at?: string | null; info?: { label: string; text: string }[];
  };
  const kind: AnnouncementKind = a.kind ?? "UPDATE";
  const [data, setData] = useState<PreviewData>({ church: null, event: null, going: 0, slots: [], praying: 0, contact: null });

  useEffect(() => {
    let alive = true;
    const db = supabase as any;
    if (!db) return;
    void (async () => {
      const ctx = await getCurrentContext();
      const none = Promise.resolve({ data: null });
      const [ev, rsvps, slots, signups, reacts, contact] = await Promise.all([
        a.event_id ? db.from("events").select("title, start_at, end_at, location, address").eq("id", a.event_id).maybeSingle() : none,
        a.event_id ? db.from("event_rsvps").select("status").eq("event_id", a.event_id).eq("status", "GOING") : none,
        kind === "SIGNUP" ? db.from("announcement_slots").select("id, label, detail, capacity").eq("announcement_id", a.id).order("position") : none,
        kind === "SIGNUP" ? db.from("announcement_signups").select("slot_id").eq("announcement_id", a.id) : none,
        kind === "PRAYER" ? db.from("announcement_reactions").select("user_id").eq("announcement_id", a.id) : none,
        a.contact_user_id ? db.from("profiles").select("full_name, email, role").eq("id", a.contact_user_id).maybeSingle() : none,
      ]);
      if (!alive) return;
      const taken = new Map<string, number>();
      for (const s of (signups.data ?? []) as { slot_id: string }[]) taken.set(s.slot_id, (taken.get(s.slot_id) ?? 0) + 1);
      setData({
        church: ctx?.church?.name ?? null,
        event: ev.data ? { ...ev.data, address: ev.data.address || ctx?.church?.address || null } : null,
        going: (rsvps.data ?? []).length,
        slots: ((slots.data ?? []) as { id: string; label: string; detail: string | null; capacity: number }[]).map((s) => ({ ...s, taken: taken.get(s.id) ?? 0 })),
        praying: (reacts.data ?? []).length,
        contact: contact.data ? { name: contact.data.full_name?.trim() || contact.data.email || "Church contact", role: contact.data.role } : null,
      });
    })();
    return () => { alive = false; };
  }, [a.id, a.event_id, a.contact_user_id, kind]);

  const meta = KIND_META[kind];
  const when = a.publish_at ? new Date(a.publish_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "";
  const closes = kind === "SIGNUP" && a.closes_at ? `Closes ${new Date(a.closes_at).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}` : null;
  const audience = a.audience === "ALL" ? "Everyone" : (audienceLabels[a.audience] ?? "Members");
  const caption =
    status === "DRAFT"
      ? "Drafts are not visible in the app yet"
      : status === "SCHEDULED" && a.publish_at
        ? `${audience} see this from ${formatShortWeekdayDateTime(a.publish_at)}`
        : `What ${audience.toLowerCase()} see in the app`;
  const ev = data.event;
  const start = ev ? new Date(ev.start_at) : null;
  const totalCap = data.slots.reduce((s, x) => s + x.capacity, 0);
  const totalTaken = data.slots.reduce((s, x) => s + Math.min(x.capacity, x.taken), 0);
  const info = Array.isArray(a.info) ? a.info : [];

  return (
    <div>
      <div className="mx-auto w-full max-w-[340px] overflow-hidden rounded-[28px] border border-[var(--border)] bg-white shadow-[0_16px_40px_-24px_rgba(28,25,23,0.35)]">
        <div className="max-h-[640px] overflow-y-auto">
          <div className="relative aspect-[3/2] bg-[#EEEDEB]">
            {a.image_url ? <img src={a.image_url} alt="" className="h-full w-full object-cover" /> : <AppBrandArt seed={a.id} />}
            <div className="absolute inset-x-3 top-3 flex justify-between" aria-hidden>
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/75 bg-white/85"><ChevronLeft className="h-5 w-5 text-[#1C1917]" /></span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/75 bg-white/85"><Share className="h-4 w-4 text-[#1C1917]" /></span>
            </div>
          </div>
          <div className="px-5 pb-6 pt-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg px-2 py-0.5 text-xs font-semibold" style={{ background: meta.area.tint, color: meta.area.ink }}>{meta.label}</span>
              {a.important ? <span className="rounded-lg bg-[#FDF0D5] px-2 py-0.5 text-xs font-semibold text-[#7A4508]">Important</span> : null}
              <span className={`text-[13px] font-medium ${closes ? "font-semibold text-[#B45309]" : "text-[#57534E]"}`}>{closes ?? when}</span>
            </div>
            <h3 className="mt-3 text-[28px] font-bold leading-[34px] tracking-[-0.02em] text-[#1C1917]">{a.title || "Untitled"}</h3>
            <p className="mt-2.5 flex items-center gap-1.5 text-sm font-medium text-[#57534E]">
              <Church className="h-[15px] w-[15px] text-[#78716C]" aria-hidden />
              <span className="truncate">{data.church ?? "Your church"}</span>
            </p>

            {ev && start ? (
              <div className="mt-[18px] overflow-hidden rounded-2xl border border-[#E7E5E4]">
                <div className="flex items-center gap-3.5 px-4 py-3.5">
                  <div className="flex h-12 w-11 flex-col items-center justify-center rounded-[10px]" style={{ background: meta.area.tint, color: meta.area.ink }}>
                    <span className="text-[10px] font-bold tracking-wide">{start.toLocaleDateString("en-US", { month: "short" }).toUpperCase()}</span>
                    <span className="text-lg font-bold leading-5">{start.getDate()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-[#1C1917]">{start.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
                    <p className="text-sm text-[#57534E]">{clockOf(start)}{ev.end_at ? ` – ${clockOf(new Date(ev.end_at))}` : ""}</p>
                  </div>
                  <span className="text-sm font-semibold text-[#B45309]">Add to calendar</span>
                </div>
                {ev.location || ev.address ? (
                  <div className="flex items-center gap-3.5 border-t border-[#E7E5E4] px-4 py-3.5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#EEEDEB]"><MapPin className="h-5 w-5 text-[#57534E]" aria-hidden /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold text-[#1C1917]">{ev.location || data.church}</p>
                      {ev.address ? <p className="truncate text-sm text-[#57534E]">{ev.address}</p> : null}
                    </div>
                    <span className="text-sm font-semibold text-[#B45309]">Directions</span>
                  </div>
                ) : null}
              </div>
            ) : kind === "EVENT" ? (
              <p className="mt-4 rounded-xl bg-[#FFF8EB] px-3 py-2 text-sm text-[#7A4508]">Pick the event in Edit so the app can show its date and RSVP.</p>
            ) : null}

            {a.body ? (
              ev || kind === "SIGNUP" ? (
                <>
                  <p className="mb-2.5 mt-6 text-lg font-bold text-[#1C1917]">About</p>
                  <p className="whitespace-pre-line text-[17px] leading-[27px] text-[#1C1917]">{a.body}</p>
                </>
              ) : (
                <>
                  <div className="my-5 h-px bg-[#E7E5E4]" />
                  <p className="whitespace-pre-line text-[17px] leading-[27px] text-[#1C1917]">{a.body}</p>
                </>
              )
            ) : null}

            {kind === "PRAYER" ? (
              <span className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full border border-[#E7E5E4] px-4 text-[15px] font-semibold text-[#1C1917]">
                <HandHeart className="h-5 w-5" style={{ color: meta.area.ink }} aria-hidden /> I&#39;m praying · {data.praying}
              </span>
            ) : null}

            {kind === "SIGNUP" ? (
              <>
                <div className="mt-6 flex items-baseline justify-between">
                  <p className="text-lg font-bold text-[#1C1917]">Pick a slot</p>
                  <p className="text-sm text-[#57534E]">{totalTaken} of {totalCap} taken</p>
                </div>
                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#F0EFED]"><div className="h-1.5 bg-[#009B90]" style={{ width: `${totalCap ? (totalTaken / totalCap) * 100 : 0}%` }} /></div>
                <div className="mt-3.5 overflow-hidden rounded-2xl border border-[#E7E5E4]">
                  {data.slots.map((sl, i) => (
                    <div key={sl.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-[#E7E5E4]" : ""}`}>
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-semibold text-[#1C1917]">{sl.label}</p>
                        <p className="text-sm text-[#57534E]">{sl.taken >= sl.capacity ? "Taken" : sl.detail || "Open"}{sl.capacity > 1 ? ` · ${sl.taken}/${sl.capacity}` : ""}</p>
                      </div>
                      {sl.taken >= sl.capacity ? null : <span className="rounded-[10px] bg-[#1C1917] px-3.5 py-2 text-sm font-semibold text-white">Take it</span>}
                    </div>
                  ))}
                  {data.slots.length === 0 ? <p className="px-4 py-3 text-sm text-[#57534E]">No slots yet. Add them in Edit.</p> : null}
                </div>
              </>
            ) : null}

            {info.length ? (
              <>
                <p className="mb-2.5 mt-6 text-lg font-bold text-[#1C1917]">Know before you go</p>
                <div className="overflow-hidden rounded-2xl border border-[#E7E5E4]">
                  {info.map((it, i) => (
                    <div key={i} className={`px-4 py-3 ${i > 0 ? "border-t border-[#E7E5E4]" : ""}`}>
                      {it.label ? <p className="text-[15px] font-semibold text-[#1C1917]">{it.label}</p> : null}
                      {it.text ? <p className="text-sm text-[#57534E]">{it.text}</p> : null}
                    </div>
                  ))}
                </div>
              </>
            ) : null}

            {data.contact ? (
              <>
                <p className="mb-2.5 mt-6 text-lg font-bold text-[#1C1917]">Questions?</p>
                <p className="text-[15px] font-semibold text-[#1C1917]">{data.contact.name}</p>
                <p className="text-sm text-[#57534E]">{roleWord(data.contact.role)}</p>
              </>
            ) : null}
          </div>
        </div>
        {ev ? (
          <div className="flex items-center gap-3 border-t border-[#E7E5E4] px-5 py-3">
            <div className="flex-1">
              <p className="text-[13px] text-[#57534E]">{data.going} going</p>
              <p className="text-[15px] font-semibold text-[#1C1917]">Are you coming?</p>
            </div>
            <span className="rounded-[14px] bg-[#F59E0B] px-5 py-3 text-base font-semibold text-[#3A2600]">I&#39;m going</span>
          </div>
        ) : null}
      </div>
      <p className="mx-auto mt-3 max-w-[340px] text-center text-xs text-[var(--text-muted)]">{caption}</p>
    </div>
  );
}
