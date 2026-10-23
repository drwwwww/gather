import { useEffect, useRef } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ds";
import { announcementToast, digestToast, eventToast } from "../lib/toasts";

type Kind = "event" | "announcement";
type Arrival = {
  kind: Kind; id: string; title: string; body: string | null; publish_at: string | null; image_url: string | null;
  start_at?: string | null; location?: string | null;
};

/**
 * Live "while you're in the app" toast for brand-new events/announcements.
 * Requires `events` and `announcements` to be in the `supabase_realtime`
 * publication (see migration 0031) — without that, postgres_changes never fires.
 *
 * Arrivals within a short window are batched into one toast so a bulk import
 * doesn't fire five toasts back to back; 3+ collapses into one digest banner.
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
        const events = items.filter((i) => i.kind === "event").length;
        showToast(digestToast(events, items.length - events));
        return;
      }

      for (const item of items) {
        showToast(
          item.kind === "event"
            ? eventToast({ id: item.id, title: item.title, start_at: item.start_at, location: item.location })
            : announcementToast(item)
        );
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
          const row = payload.new as { id: string; title: string; start_at: string | null; location: string | null };
          enqueue({ kind: "event", id: row.id, title: row.title, body: null, publish_at: null, image_url: null, start_at: row.start_at, location: row.location });
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
