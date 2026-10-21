import { useEffect } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { navigate, navigationRef } from "../navigation/navigationRef";
import { supabase } from "../supabase";

type PushData = { type?: string; plan_id?: string; event_id?: string; announcement_id?: string };

/** Where a tapped notification should land. Anything unknown opens the inbox. */
export async function openForNotification(data: PushData) {
  switch (data.type) {
    case "ASSIGNMENT_NEW":
    case "ASSIGNMENT_REMINDER":
      return navigate("MainTabs", { screen: "Serve" });
    case "STEP_PROGRESS":
    case "STEP_THANKS":
    case "SERVICE_STARTING":
      return navigate("MainTabs", { screen: "ServicePlan" });
    case "EVENT_NEW":
      return data.event_id ? navigate("EventDetail", { eventId: data.event_id }) : navigate("MainTabs", { screen: "Events" });
    case "ANNOUNCEMENT_NEW": {
      if (data.announcement_id && supabase) {
        const { data: a } = await supabase
          .from("announcements")
          .select("id, title, body, publish_at, image_url")
          .eq("id", data.announcement_id)
          .maybeSingle();
        if (a) return navigate("AnnouncementsDetail", { announcement: a });
      }
      return navigate("MainTabs", { screen: "Announcements" });
    }
    default:
      return navigate("Notifications");
  }
}

/** A tapped push has been seen — mark its inbox row(s) read so the list doesn't still say "New". */
async function markPushRead(data: PushData) {
  if (!supabase || !data.type) return;
  const { data: session } = await supabase.auth.getSession();
  const uid = session.session?.user.id;
  if (!uid) return;
  let q = (supabase as any)
    .from("notification_log")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", uid)
    .eq("type", data.type)
    .is("read_at", null);
  if (data.plan_id) q = q.eq("payload->>plan_id", data.plan_id);
  if (data.event_id) q = q.eq("payload->>event_id", data.event_id);
  if (data.announcement_id) q = q.eq("payload->>announcement_id", data.announcement_id);
  await q;
}

/**
 * Tapping a push opens the screen it's about — including the push that
 * launched the app from closed (it waits until navigation is ready).
 */
export function usePushTaps() {
  useEffect(() => {
    if (Platform.OS === "web") return;
    let alive = true;
    const handled = new Set<string>();

    const handle = (response: Notifications.NotificationResponse | null) => {
      if (!response) return;
      const id = response.notification.request.identifier;
      if (handled.has(id)) return;
      handled.add(id);
      const data = (response.notification.request.content.data ?? {}) as PushData;
      void markPushRead(data).catch(() => {});
      const go = (tries: number) => {
        if (!alive) return;
        if (navigationRef.isReady()) void openForNotification(data);
        else if (tries > 0) setTimeout(() => go(tries - 1), 250);
      };
      go(20);
    };

    void Notifications.getLastNotificationResponseAsync().then(handle).catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(handle);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
}
