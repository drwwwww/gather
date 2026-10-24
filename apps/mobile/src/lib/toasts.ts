import type { ToastPayload } from "../components/ds";
import { navigate } from "../navigation/navigationRef";
import { AREA } from "../theme/areas";

/**
 * The in-app banners for new posts, shared by the live (Realtime) and
 * "while you were away" checks so both read the same.
 */

type AnnouncementLike = { id: string; title: string; body: string | null; publish_at: string | null; image_url: string | null };
type EventLike = { id: string; title: string; start_at?: string | null; location?: string | null };

const oneLine = (text: string | null | undefined) => (text ?? "").replace(/\s+/g, " ").trim();

export function announcementToast(a: AnnouncementLike): ToastPayload {
  return {
    eyebrow: "News",
    accent: AREA.news,
    title: a.title || "New announcement",
    subtitle: oneLine(a.body) || undefined,
    image: a.image_url ? { uri: a.image_url } : undefined,
    artSeed: a.image_url ? undefined : a.id,
    onPress: () =>
      navigate("AnnouncementsDetail", {
        announcement: { id: a.id, title: a.title, body: a.body ?? "", publish_at: a.publish_at, image_url: a.image_url },
      }),
  };
}

export function eventToast(e: EventLike): ToastPayload {
  const start = e.start_at ? new Date(e.start_at) : null;
  const when = start
    ? start.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : "";
  return {
    eyebrow: "New event",
    accent: AREA.events,
    title: e.title || "New event",
    subtitle: [when, e.location].filter(Boolean).join(" · ") || undefined,
    date: start
      ? { month: start.toLocaleDateString(undefined, { month: "short" }).toUpperCase(), day: String(start.getDate()) }
      : undefined,
    icon: "events",
    onPress: () => navigate("EventDetail", { eventId: e.id }),
  };
}

/** Several at once collapse into one banner rather than a queue of them. */
export function digestToast(events: number, announcements: number, away = false): ToastPayload {
  const parts = [
    announcements ? `${announcements} new ${announcements === 1 ? "post" : "posts"}` : "",
    events ? `${events} new ${events === 1 ? "event" : "events"}` : "",
  ].filter(Boolean);
  return {
    eyebrow: away ? "While you were away" : "From your church",
    title: parts.join(" and "),
    subtitle: "Tap to catch up",
    icon: "sparkle",
    onPress: () => navigate(events > announcements ? "Events" : "Announcements"),
  };
}
