import { useEffect, useRef } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ds";
import { navigate } from "../navigation/navigationRef";

type Kind = "event" | "announcement";
type Arrival = { kind: Kind; id: string; title: string; body: string | null; publish_at: string | null; image_url: string | null };

/**
 * Live "while you're in the app" toast for brand-new events/announcements.
 * Requires `events` and `announcements` to be in the `supabase_realtime`
 * publication (see migration 0031) — without that, postgres_changes never fires.
 *
 * Arrivals within a short window are batched into one toast so a bulk import
 * doesn't fire five toasts back to back; 3+ collapses to "Multiple updates".
 */
export function useLiveUpdatesToast() {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const bufferRef = useRef<Arrival[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!supabase || !profile?.church_id) return;
    const client = supabase;

    const flush = () => {
      const items = bufferRef.current;
      bufferRef.current = [];
      timerRef.current = null;
      if (items.length === 0) return;

      if (items.length > 2) {
        showToast({
          title: "Multiple updates",
          subtitle: `${items.length} new events and announcements`,
          icon: "sparkle",
          onPress: () => navigate(items[0].kind === "event" ? "Events" : "Announcements"),
        });
        return;
      }

      for (const item of items) {
        if (item.kind === "event") {
          showToast({
            title: "New event",
            subtitle: item.title,
            icon: "events",
            onPress: () => navigate("EventDetail", { eventId: item.id }),
          });
        } else {
          showToast({
            title: "New announcement",
            subtitle: item.title,
            icon: "announcements",
            onPress: () =>
              navigate("AnnouncementsDetail", {
                announcement: { id: item.id, title: item.title, body: item.body ?? "", publish_at: item.publish_at, image_url: item.image_url },
              }),
          });
        }
      }
    };

    const enqueue = (arrival: Arrival) => {
      bufferRef.current.push(arrival);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, 1200);
    };

    const channel = client
      .channel(`live-updates-${profile.church_id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "events", filter: `church_id=eq.${profile.church_id}` },
        (payload) => {
          const row = payload.new as { id: string; title: string };
          enqueue({ kind: "event", id: row.id, title: row.title, body: null, publish_at: null, image_url: null });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "announcements", filter: `church_id=eq.${profile.church_id}` },
        (payload) => {
          const row = payload.new as { id: string; title: string; body: string | null; publish_at: string | null; image_url: string | null };
          enqueue({ kind: "announcement", id: row.id, title: row.title, body: row.body, publish_at: row.publish_at, image_url: row.image_url });
        }
      )
      .subscribe();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      client.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, profile?.church_id]);
}
