export type LocalEvent = {
  id: string;
  title: string;
  description: string;
  location: string;
  startAt: string;
  endAt?: string;
  audience: "ALL" | "MEMBERS" | "SERVICE";
};

export type LocalRsvpStatus = "GOING" | "MAYBE" | "NO";

export type LocalRsvp = {
  eventId: string;
  status: LocalRsvpStatus;
};

const STORAGE_KEY = "gather_mobile_events_v1";

type LocalEventState = {
  events: LocalEvent[];
  rsvps: LocalRsvp[];
};

const defaultState: LocalEventState = {
  events: [
    {
      id: "event-demo",
      title: "Community Night",
      description: "Food, friends, and a short update from the team.",
      location: "Fellowship Hall",
      startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      endAt: "",
      audience: "ALL"
    }
  ],
  rsvps: []
};

export function loadLocalEvents() {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as LocalEventState;
    return {
      events: parsed.events ?? defaultState.events,
      rsvps: parsed.rsvps ?? []
    };
  } catch {
    return defaultState;
  }
}

export function saveLocalEvents(next: LocalEventState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
