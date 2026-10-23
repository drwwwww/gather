import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ds";
import { getLastSeenAt, setLastSeenAt } from "../lib/localFlags";
import { announcementToast, digestToast, eventToast } from "../lib/toasts";

/**
 * "What happened while you were gone" — checked on cold start and whenever the
 * app comes back to the foreground. Complements `useLiveUpdatesToast`, which
 * only catches inserts that happen while actively connected; Realtime does not
 * replay missed events after a reconnect, so this polling check covers the gap.
 */
export function useReopenDigest() {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const checkingRef = useRef(false);

  useEffect(() => {
    if (!supabase || !user?.id || !profile?.church_id) return;
    const client = supabase;
    const userId = user.id;
    const churchId = profile.church_id;

    const check = async () => {
      if (checkingRef.current) return;
      checkingRef.current = true;
      try {
        const now = new Date().toISOString();
        const since = await getLastSeenAt(userId);

        // First ever check on this device — establish a baseline, don't dump history.
        if (!since) {
          await setLastSeenAt(userId, now);
          return;
        }

        type EventRow = { id: string; title: string; start_at: string | null; location: string | null };
        type AnnouncementRow = { id: string; title: string; body: string | null; publish_at: string | null; image_url: string | null };

        const [eventsRes, announcementsRes] = await Promise.all([
          client.from("events").select("id, title, start_at, location").eq("church_id", churchId).gt("created_at", since).order("created_at", { ascending: false }),
          client.from("announcements").select("id, title, body, publish_at, image_url").eq("church_id", churchId).gt("created_at", since).order("created_at", { ascending: false }),
        ]);

        const events = (eventsRes.data ?? []) as EventRow[];
        const announcements = (announcementsRes.data ?? []) as AnnouncementRow[];
        const total = events.length + announcements.length;

        await setLastSeenAt(userId, now);

        if (total === 0) return;

        if (total > 2) {
          showToast(digestToast(events.length, announcements.length, true));
          return;
        }

        for (const e of events) showToast(eventToast(e));
        for (const a of announcements) showToast(announcementToast(a));
      } finally {
        checkingRef.current = false;
      }
    };

    check();
    const sub = AppState.addEventListener("change", (state: string) => {
      if (state === "active") check();
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, profile?.church_id]);
}
