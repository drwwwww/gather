/**
 * Announcement types (migration 0052) on the phone: the feed and the detail
 * screen read the same shapes from here, so a card and its page always agree.
 */
import { AREA, type AreaColors } from "../theme/areas";

export type AnnouncementKind = "UPDATE" | "EVENT" | "SIGNUP" | "PRAYER";

export const KIND_META: Record<AnnouncementKind, { label: string; area: AreaColors }> = {
  UPDATE: { label: "Update", area: AREA.news },
  EVENT: { label: "Event", area: AREA.events },
  SIGNUP: { label: "Sign-up", area: AREA.services },
  PRAYER: { label: "Prayer", area: AREA.ministries },
};

export type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  publish_at: string | null;
  created_at: string;
  image_url: string | null;
  kind: AnnouncementKind;
  pinned: boolean;
  important: boolean;
  event_id: string | null;
  contact_user_id: string | null;
  closes_at: string | null;
  info: { label: string; text: string }[];
};

export const ANNOUNCEMENT_COLUMNS =
  "id, title, body, publish_at, created_at, image_url, kind, pinned, important, event_id, contact_user_id, closes_at, info";

export type LinkedEvent = { id: string; title: string; start_at: string; end_at: string | null; location: string | null; address: string | null; is_cancelled: boolean };
export type Slot = { id: string; label: string; detail: string | null; capacity: number; takers: { userId: string; name: string }[] };

export type Extras = {
  events: Record<string, LinkedEvent>;
  going: Record<string, number>;
  maybe: Record<string, number>;
  myRsvp: Record<string, "GOING" | "MAYBE" | "NO">;
  slots: Record<string, Slot[]>;
  praying: Record<string, number>;
  iPray: Set<string>;
};

export const normalize = (r: any): AnnouncementRow => ({
  ...r,
  kind: (r.kind as AnnouncementKind) || "UPDATE",
  pinned: !!r.pinned,
  important: !!r.important,
  info: Array.isArray(r.info) ? r.info : [],
});

export const isClosed = (a: Pick<AnnouncementRow, "closes_at">) => !!a.closes_at && new Date(a.closes_at) <= new Date();

/** Everything the cards and pages need beyond the announcement rows themselves. */
export async function loadExtras(client: any, rows: AnnouncementRow[], userId: string): Promise<Extras> {
  const eventIds = [...new Set(rows.filter((r) => r.kind === "EVENT" && r.event_id).map((r) => r.event_id!))];
  const signupIds = rows.filter((r) => r.kind === "SIGNUP").map((r) => r.id);
  const prayerIds = rows.filter((r) => r.kind === "PRAYER").map((r) => r.id);
  const none = Promise.resolve({ data: [] });

  const [evRes, rsvpRes, slotRes, signupRes, reactRes] = await Promise.all([
    eventIds.length ? client.from("events").select("id, title, start_at, end_at, location, address, is_cancelled").in("id", eventIds) : none,
    eventIds.length ? client.from("event_rsvps").select("event_id, user_id, status").in("event_id", eventIds) : none,
    signupIds.length ? client.from("announcement_slots").select("id, announcement_id, label, detail, capacity, position").in("announcement_id", signupIds).order("position") : none,
    signupIds.length ? client.from("announcement_signups").select("slot_id, user_id").in("announcement_id", signupIds) : none,
    prayerIds.length ? client.from("announcement_reactions").select("announcement_id, user_id").in("announcement_id", prayerIds) : none,
  ]);

  const takerIds = [...new Set(((signupRes.data ?? []) as { user_id: string }[]).map((s) => s.user_id))];
  const names: Record<string, string> = {};
  if (takerIds.length) {
    const { data } = await client.from("profiles").select("id, full_name, email").in("id", takerIds);
    for (const p of (data ?? []) as { id: string; full_name: string | null; email: string | null }[]) {
      names[p.id] = p.full_name?.trim() || p.email?.split("@")[0] || "Someone";
    }
  }

  const x: Extras = { events: {}, going: {}, maybe: {}, myRsvp: {}, slots: {}, praying: {}, iPray: new Set() };
  for (const e of (evRes.data ?? []) as LinkedEvent[]) x.events[e.id] = e;
  for (const r of (rsvpRes.data ?? []) as { event_id: string; user_id: string; status: "GOING" | "MAYBE" | "NO" }[]) {
    if (r.status === "GOING") x.going[r.event_id] = (x.going[r.event_id] ?? 0) + 1;
    if (r.status === "MAYBE") x.maybe[r.event_id] = (x.maybe[r.event_id] ?? 0) + 1;
    if (r.user_id === userId) x.myRsvp[r.event_id] = r.status;
  }
  const takers = new Map<string, { userId: string; name: string }[]>();
  for (const s of (signupRes.data ?? []) as { slot_id: string; user_id: string }[]) {
    const list = takers.get(s.slot_id) ?? [];
    list.push({ userId: s.user_id, name: names[s.user_id] ?? "Someone" });
    takers.set(s.slot_id, list);
  }
  for (const s of (slotRes.data ?? []) as (Omit<Slot, "takers"> & { announcement_id: string })[]) {
    (x.slots[s.announcement_id] ??= []).push({ id: s.id, label: s.label, detail: s.detail, capacity: s.capacity, takers: takers.get(s.id) ?? [] });
  }
  for (const r of (reactRes.data ?? []) as { announcement_id: string; user_id: string }[]) {
    x.praying[r.announcement_id] = (x.praying[r.announcement_id] ?? 0) + 1;
    if (r.user_id === userId) x.iPray.add(r.announcement_id);
  }
  return x;
}

export function slotTotals(slots: Slot[] | undefined, userId: string) {
  const list = slots ?? [];
  const capacity = list.reduce((s, x) => s + x.capacity, 0);
  const taken = list.reduce((s, x) => s + Math.min(x.capacity, x.takers.length), 0);
  const mine = list.find((x) => x.takers.some((t) => t.userId === userId)) ?? null;
  return { capacity, taken, mine };
}

export async function setRsvp(client: any, eventId: string, userId: string, status: "GOING" | "MAYBE" | "NO") {
  const { error } = await client.from("event_rsvps").upsert({ event_id: eventId, user_id: userId, status }, { onConflict: "event_id,user_id" });
  return error ? "Couldn't save your RSVP. Try again." : null;
}

export async function takeSlot(client: any, slotId: string) {
  const { data, error } = await client.rpc("take_announcement_slot", { p_slot_id: slotId });
  if (error) return "Couldn't save that. Try again.";
  if (data?.error === "full") return "Someone just took that one. Pick another.";
  if (data?.error === "closed") return "Sign-ups for this have closed.";
  if (data?.error) return "This sign-up isn't available anymore.";
  return null;
}

export async function leaveSlot(client: any, slotId: string) {
  const { error } = await client.rpc("leave_announcement_slot", { p_slot_id: slotId });
  return error ? "Couldn't save that. Try again." : null;
}

export async function setPraying(client: any, announcementId: string, churchId: string, userId: string, on: boolean) {
  const { error } = on
    ? await client.from("announcement_reactions").insert({ announcement_id: announcementId, church_id: churchId, user_id: userId, kind: "PRAYING" })
    : await client.from("announcement_reactions").delete().eq("announcement_id", announcementId).eq("user_id", userId);
  return error ? "Couldn't save that. Try again." : null;
}

export function relativeLabel(at: string | null, fallback: string): string {
  const d = new Date(at ?? fallback);
  if (Number.isNaN(d.getTime())) return "Recently";
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days < 0) return "Scheduled";
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "Last week";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** "Closes Friday" / "Closes Nov 3" / "Closed". */
export function closesLabel(closesAt: string | null): string | null {
  if (!closesAt) return null;
  const d = new Date(closesAt);
  if (d <= new Date()) return "Closed";
  const days = (d.getTime() - Date.now()) / 86_400_000;
  return `Closes ${days < 6 ? d.toLocaleDateString(undefined, { weekday: "long" }) : d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}
