import { Linking, Platform, Share } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type EventLike = {
  id: string;
  title: string;
  description?: string | null;
  location: string | null;
  address?: string | null;
  start_at: string;
  end_at: string | null;
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const time = (d: Date) => d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

/**
 * Date and time as two full strings — never squeezed into a grid cell.
 *   dateLine: "Friday, October 23"  (short: "Fri, Oct 23")
 *   timeLine: "6:30 – 8:30 PM", or "Oct 23, 6:30 PM – Oct 24, 9:00 AM" for multi-day
 */
export function eventWhen(e: Pick<EventLike, "start_at" | "end_at">, short = false) {
  const start = new Date(e.start_at);
  const end = e.end_at ? new Date(e.end_at) : null;
  const dateOpts: Intl.DateTimeFormatOptions = short
    ? { weekday: "short", month: "short", day: "numeric" }
    : { weekday: "long", month: "long", day: "numeric" };
  const dateLine = start.toLocaleDateString(undefined, dateOpts);
  let timeLine = time(start);
  if (end && sameDay(start, end)) {
    const s = time(start), en = time(end);
    // "6:30 PM – 8:30 PM" → "6:30 – 8:30 PM" when both share AM/PM
    const sp = s.match(/\s?(AM|PM)$/i)?.[1], ep = en.match(/\s?(AM|PM)$/i)?.[1];
    timeLine = sp && ep && sp === ep ? `${s.replace(/\s?(AM|PM)$/i, "")} – ${en}` : `${s} – ${en}`;
  } else if (end) {
    const md = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    timeLine = `${md(start)}, ${time(start)} – ${md(end)}, ${time(end)}`;
  }
  return { dateLine, timeLine };
}

export type EventPhase = "upcoming" | "soon" | "now" | "ended";

/** Where the event is relative to now; an event without an end lasts ~2h. */
export function eventPhase(e: Pick<EventLike, "start_at" | "end_at">, now = Date.now()): EventPhase {
  const start = new Date(e.start_at).getTime();
  const end = e.end_at ? new Date(e.end_at).getTime() : start + 2 * 3600_000;
  if (now >= end) return "ended";
  if (now >= start) return "now";
  if (start - now < 72 * 3600_000) return "soon";
  return "upcoming";
}

/** The event's own address, else its church's. */
export const eventAddress = (e: Pick<EventLike, "address">, churchAddress?: string | null) =>
  e.address?.trim() || churchAddress?.trim() || null;

/** Opens turn-by-turn directions in the platform's maps app. */
export function openDirections(address: string, label?: string) {
  const q = encodeURIComponent(address);
  const url = Platform.select({
    ios: `http://maps.apple.com/?daddr=${q}`,
    android: `geo:0,0?q=${q}${label ? `(${encodeURIComponent(label)})` : ""}`,
    default: `https://www.google.com/maps/dir/?api=1&destination=${q}`,
  })!;
  return Linking.openURL(url).catch(() =>
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${q}`)
  );
}

/**
 * Opens the system "new calendar event" sheet prefilled — the person reviews
 * and saves it themselves, so no broad calendar access is needed.
 * Resolves false where unavailable (web preview).
 */
export async function addToCalendar(e: EventLike, address: string | null): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const Calendar = await import("expo-calendar");
  const start = new Date(e.start_at);
  const end = e.end_at ? new Date(e.end_at) : new Date(start.getTime() + 2 * 3600_000);
  await Calendar.createEventInCalendarAsync({
    title: e.title,
    startDate: start,
    endDate: end,
    location: [e.location, address].filter(Boolean).join(", ") || undefined,
    notes: e.description ?? undefined,
  });
  return true;
}

export async function shareEvent(e: EventLike, address: string | null) {
  const { dateLine, timeLine } = eventWhen(e);
  const where = [e.location, address].filter(Boolean).join("\n");
  try {
    await Share.share({ message: `${e.title}\n${dateLine} · ${timeLine}${where ? `\n${where}` : ""}` });
  } catch {
    /* dismissed */
  }
}

// ── Saved events (per user, on this device) ───────────────────────────────
const savedKey = (userId: string) => `gather:${userId}:savedEvents`;

export async function loadSavedEvents(userId: string): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(savedKey(userId));
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export async function setEventSaved(userId: string, eventId: string, saved: boolean): Promise<Set<string>> {
  const set = await loadSavedEvents(userId);
  if (saved) set.add(eventId);
  else set.delete(eventId);
  try {
    await AsyncStorage.setItem(savedKey(userId), JSON.stringify([...set]));
  } catch {
    /* best effort */
  }
  return set;
}
