"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "../../../components/admin/AdminHeader";
import { Button } from "../../../components/ui/button";
import { Card, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { getCurrentContext } from "../../../lib/supabaseData";
import { supabase } from "../../../lib/supabaseClient";
import { formatRelativeTime, formatShortDate } from "../../../lib/format";
import type { Database } from "@gather/lib";

type NotificationRow = Database["public"]["Tables"]["notification_log"]["Row"];

type NotificationMeta = {
  title: string;
  tone: "info" | "warning" | "success" | "error" | "default";
  detail?: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read_at).length,
    [notifications]
  );

  const refresh = async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    const context = await getCurrentContext();
    if (!context) {
      router.push("/login");
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("notification_log")
      .select("*")
      .eq("church_id", context.profile.church_id)
      .or(`user_id.eq.${context.userId},user_id.is.null`)
      .order("sent_at", { ascending: false, nullsFirst: false })
      .limit(50);

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setNotifications(data ?? []);
    setLoading(false);

    if (context.profile.role === "ADMIN") {
      await markAllAsRead(context.profile.church_id, context.userId, false);
    }
  };

  const markAllAsRead = async (churchId: string, userId: string, showLoading = true) => {
    if (!supabase) return;
    if (showLoading) setMarking(true);
    const { error: updateError } = await supabase
      .from("notification_log")
      .update({ read_at: new Date().toISOString() })
      .eq("church_id", churchId)
      .is("read_at", null)
      .or(`user_id.eq.${userId},user_id.is.null`);

    if (updateError) {
      setError(updateError.message);
    } else {
      setNotifications((prev) =>
        prev.map((item) => (item.read_at ? item : { ...item, read_at: new Date().toISOString() }))
      );
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("gather-notifications-updated"));
      }
    }

    if (showLoading) setMarking(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const renderMeta = (notification: NotificationRow): NotificationMeta => {
    if (notification.type === "ASSIGNMENT_REMINDER") {
      const payload = notification.payload as { scheduled_date?: string };
      const dateLabel = payload?.scheduled_date ? formatShortDate(payload.scheduled_date) : "";
      return {
        title: "Assignment reminder",
        tone: "warning",
        detail: dateLabel ? `Service date: ${dateLabel}` : undefined
      };
    }

    return {
      title: notification.type.replace(/_/g, " ").toLowerCase(),
      tone: "info"
    };
  };

  return (
    <>
      <AdminHeader
        title="Notifications"
        subtitle="Track reminders and activity across the church."
        actions={
          <Button size="sm" variant="outline" onClick={async () => {
            const context = await getCurrentContext();
            if (!context) return;
            await markAllAsRead(context.profile.church_id, context.userId);
          }} disabled={marking || unreadCount === 0}
          >
            {marking ? "Marking..." : "Mark all as read"}
          </Button>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Recent notifications</CardTitle>
            <p className="text-xs text-[var(--gather-muted)] mt-1">
              {unreadCount ? `${unreadCount} unread` : "All caught up."}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {loading ? (
            <p className="text-sm text-[var(--gather-muted)]">Loading notifications...</p>
          ) : notifications.length === 0 ? (
            <div className="rounded-xl border border-dashed border-base-300 p-6 text-center">
              <p className="text-sm text-[var(--gather-muted)]">No notifications yet.</p>
              <p className="text-xs text-[var(--gather-muted)] mt-1">We will show reminders and updates here.</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const meta = renderMeta(notification);
              return (
                <div
                  key={notification.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-base-100 p-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-[var(--gather-ink)]">{meta.title}</p>
                      {!notification.read_at ? <Badge variant={meta.tone}>Unread</Badge> : null}
                    </div>
                    {meta.detail ? (
                      <p className="text-xs text-[var(--gather-muted)]">{meta.detail}</p>
                    ) : null}
                  </div>
                  <div className="text-xs text-[var(--gather-muted)]">
                    {notification.sent_at ? formatRelativeTime(notification.sent_at) : "Just now"}
                  </div>
                </div>
              );
            })
          )}
        </div>
        {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}
      </Card>
    </>
  );
}
