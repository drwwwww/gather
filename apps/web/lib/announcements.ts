/**
 * Announcement types (migration 0052): what a post is, and what members can do
 * with it in the app. Shared by the composer, the page that saves it and the
 * in-app preview.
 */
import { AREA, type AreaColors } from "./areas";

export type AnnouncementKind = "UPDATE" | "EVENT" | "SIGNUP" | "PRAYER";

export const KIND_META: Record<AnnouncementKind, { label: string; hint: string; area: AreaColors }> = {
  UPDATE: { label: "Update", hint: "News for your church", area: AREA.news },
  EVENT: { label: "Event", hint: "Links an event so people can RSVP", area: AREA.events },
  SIGNUP: { label: "Sign-up", hint: "Slots people take, like a meal train", area: AREA.services },
  PRAYER: { label: "Prayer", hint: "People can say they're praying", area: AREA.ministries },
};

export type InfoItem = { label: string; text: string };
export type SlotDraft = { id?: string; label: string; detail: string; capacity: number; taken?: number };

export type AnnouncementExtras = {
  kind: AnnouncementKind;
  pinned: boolean;
  important: boolean;
  eventId: string;
  contactUserId: string;
  /** YYYY-MM-DD; sign-ups close at the end of that day. */
  closesDate: string;
  info: InfoItem[];
  slots: SlotDraft[];
  privateNote: string;
};

export const emptyExtras = (): AnnouncementExtras => ({
  kind: "UPDATE",
  pinned: false,
  important: false,
  eventId: "",
  contactUserId: "",
  closesDate: "",
  info: [],
  slots: [],
  privateNote: "",
});

type Row = {
  id: string;
  kind?: string | null;
  pinned?: boolean | null;
  important?: boolean | null;
  event_id?: string | null;
  contact_user_id?: string | null;
  closes_at?: string | null;
  info?: unknown;
};

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** The columns to write for these extras (slots and the private note are saved separately). */
export function extrasColumns(x: AnnouncementExtras) {
  return {
    kind: x.kind,
    pinned: x.pinned,
    important: x.important,
    event_id: x.kind === "EVENT" && x.eventId ? x.eventId : null,
    contact_user_id: x.contactUserId || null,
    closes_at: x.kind === "SIGNUP" && x.closesDate ? new Date(`${x.closesDate}T23:59:59`).toISOString() : null,
    info: x.info.filter((i) => i.label.trim() || i.text.trim()).map((i) => ({ label: i.label.trim(), text: i.text.trim() })).slice(0, 8),
  };
}

/** Read a saved post back into the composer, with its slots and private note. */
export async function loadExtras(db: any, row: Row, { keepIds = true } = {}): Promise<AnnouncementExtras> {
  const kind = (row.kind as AnnouncementKind) || "UPDATE";
  const base: AnnouncementExtras = {
    ...emptyExtras(),
    kind,
    pinned: !!row.pinned,
    important: !!row.important,
    eventId: row.event_id ?? "",
    contactUserId: row.contact_user_id ?? "",
    closesDate: row.closes_at ? ymd(new Date(row.closes_at)) : "",
    info: Array.isArray(row.info) ? (row.info as InfoItem[]).map((i) => ({ label: i.label ?? "", text: i.text ?? "" })) : [],
  };
  if (kind !== "SIGNUP") return base;
  const [slotsRes, signupsRes, privateRes] = await Promise.all([
    db.from("announcement_slots").select("id, label, detail, capacity").eq("announcement_id", row.id).order("position"),
    db.from("announcement_signups").select("slot_id").eq("announcement_id", row.id),
    db.from("announcement_private").select("note").eq("announcement_id", row.id).maybeSingle(),
  ]);
  const taken = new Map<string, number>();
  for (const s of (signupsRes.data ?? []) as { slot_id: string }[]) taken.set(s.slot_id, (taken.get(s.slot_id) ?? 0) + 1);
  return {
    ...base,
    slots: ((slotsRes.data ?? []) as { id: string; label: string; detail: string | null; capacity: number }[]).map((s) => ({
      ...(keepIds ? { id: s.id, taken: taken.get(s.id) ?? 0 } : {}),
      label: s.label,
      detail: s.detail ?? "",
      capacity: s.capacity,
    })),
    privateNote: (privateRes.data as { note: string } | null)?.note ?? "",
  };
}

/**
 * Save slots and the private note for a sign-up post: update kept slots in place
 * (so people's sign-ups stay), add new ones, remove the ones taken out.
 */
export async function saveSignupParts(db: any, announcementId: string, churchId: string, x: AnnouncementExtras): Promise<string | null> {
  const { data: existing } = await db.from("announcement_slots").select("id").eq("announcement_id", announcementId);
  const existingIds = new Set(((existing ?? []) as { id: string }[]).map((s) => s.id));
  const slots = x.kind === "SIGNUP" ? x.slots.filter((s) => s.label.trim()) : [];
  const keep = new Set(slots.map((s) => s.id).filter(Boolean) as string[]);

  const removed = [...existingIds].filter((id) => !keep.has(id));
  if (removed.length) {
    const { error } = await db.from("announcement_slots").delete().in("id", removed);
    if (error) return error.message;
  }
  for (const [position, s] of slots.entries()) {
    const values = { label: s.label.trim().slice(0, 80), detail: s.detail.trim().slice(0, 160) || null, capacity: Math.max(1, Math.min(500, s.capacity || 1)), position };
    const { error } = s.id && existingIds.has(s.id)
      ? await db.from("announcement_slots").update(values).eq("id", s.id)
      : await db.from("announcement_slots").insert({ ...values, announcement_id: announcementId, church_id: churchId });
    if (error) return error.message;
  }

  if (x.kind === "SIGNUP" && x.privateNote.trim()) {
    const { error } = await db.from("announcement_private").upsert({ announcement_id: announcementId, church_id: churchId, note: x.privateNote.trim().slice(0, 1000) });
    if (error) return error.message;
  } else {
    await db.from("announcement_private").delete().eq("announcement_id", announcementId);
  }
  return null;
}
