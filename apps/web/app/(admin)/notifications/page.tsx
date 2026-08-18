"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck, AlertTriangle, Info, PartyPopper, Clock } from "lucide-react";
import { getCurrentContext } from "../../../lib/supabaseData";
import { supabase } from "../../../lib/supabaseClient";
import { formatRelativeTime, formatShortDate } from "../../../lib/format";
import { PageGrid, PageGridFull } from "../../../components/layout/PageGrid";
import type { Database } from "@gather/lib";

type NotificationRow = Database["public"]["Tables"]["notification_log"]["Row"];
type FilterTab = "ALL" | "UNREAD";

const TONE_META = {
  warning: { icon: AlertTriangle, bg: "bg-amber-50",  text: "text-amber-600" },
  success: { icon: PartyPopper,   bg: "bg-green-50",  text: "text-green-600" },
  error:   { icon: AlertTriangle, bg: "bg-red-50",    text: "text-red-600"   },
  info:    { icon: Info,          bg: "bg-blue-50",   text: "text-blue-600"  },
  default: { icon: Bell,          bg: "bg-[var(--surface-2)]", text: "text-[var(--text-muted)]" },
} as const;

type ToneKey = keyof typeof TONE_META;

function renderMeta(notification: NotificationRow): { title: string; tone: ToneKey; detail?: string } {
  if (notification.type === "SERVE_REQUEST") {
    const payload = notification.payload as { requester_name?: string; role_names?: string[]; note?: string | null } | null;
    const who = payload?.requester_name?.trim() || "A member";
    const roles = payload?.role_names && payload.role_names.length > 0 ? payload.role_names.join(", ") : null;
    const detailParts = [roles, payload?.note ? `"${payload.note}"` : null].filter(Boolean);
    return {
      title: `${who} wants to serve`,
      tone: "success",
      detail: detailParts.length > 0 ? detailParts.join(" · ") : "No specific role picked — say hello on the People page."
    };
  }
  if (notification.type === "ASSIGNMENT_REMINDER") {
    const payload = notification.payload as { scheduled_date?: string; source?: string; part_title?: string; role_name?: string } | null;
    const dateLabel = payload?.scheduled_date ? formatShortDate(payload.scheduled_date) : "";
    const datePart = dateLabel ? `Service date: ${dateLabel}` : undefined;
    if (payload?.source === "bulletin_part" && payload.part_title) {
      return { title: "Run of show reminder", tone: "warning", detail: [payload.part_title, datePart].filter(Boolean).join(" · ") };
    }
    if (payload?.source === "bulletin_role" && payload.role_name) {
      return { title: "Role assignment reminder", tone: "warning", detail: [payload.role_name, datePart].filter(Boolean).join(" · ") };
    }
    return { title: "Assignment reminder", tone: "warning", detail: datePart };
  }
  return { title: notification.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), tone: "info" };
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [ctx, setCtx] = useState<{ churchId: string; userId: string } | null>(null);
  const router = useRouter();

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read_at).length, [notifications]);

  const filtered = useMemo(
    () => activeTab === "UNREAD" ? notifications.filter((n) => !n.read_at) : notifications,
    [notifications, activeTab]
  );

  const refresh = async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    const context = await getCurrentContext();
    if (!context) { router.push("/login"); return; }
    setCtx({ churchId: context.profile.church_id, userId: context.userId });

    const { data, error: fetchError } = await supabase
      .from("notification_log")
      .select("*")
      .eq("church_id", context.profile.church_id)
      .or(`user_id.eq.${context.userId},user_id.is.null`)
      .order("sent_at", { ascending: false, nullsFirst: false })
      .limit(50);

    if (fetchError) { setError(fetchError.message); setLoading(false); return; }
    setNotifications(data ?? []);
    setLoading(false);

    // Auto-mark as read on open
    if (context.profile.role === "ADMIN") markAllRead(context.profile.church_id, context.userId, false);
  };

  const markAllRead = async (churchId: string, userId: string, showLoading = true) => {
    if (!supabase) return;
    if (showLoading) setMarking(true);
    const { error: updateError } = await supabase
      .from("notification_log")
      .update({ read_at: new Date().toISOString() })
      .eq("church_id", churchId)
      .is("read_at", null)
      .or(`user_id.eq.${userId},user_id.is.null`);
    if (!updateError) {
      setNotifications((prev) => prev.map((n) => n.read_at ? n : { ...n, read_at: new Date().toISOString() }));
      window.dispatchEvent(new Event("gather-notifications-updated"));
    }
    if (showLoading) setMarking(false);
  };

  const markOneRead = async (id: string) => {
    if (!supabase) return;
    await supabase.from("notification_log").update({ read_at: new Date().toISOString() }).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    window.dispatchEvent(new Event("gather-notifications-updated"));
  };

  useEffect(() => { refresh(); }, []);

  return (
    <PageGrid>
      <PageGridFull className="animate-fade-in-up">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Notifications</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Reminders and activity across your church.</p>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              disabled={marking}
              onClick={async () => { if (ctx) await markAllRead(ctx.churchId, ctx.userId); }}
              className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)] disabled:opacity-50"
            >
              <CheckCheck className="h-4 w-4" />
              {marking ? "Marking…" : `Mark all read (${unreadCount})`}
            </button>
          )}
        </div>
      </PageGridFull>

      <PageGridFull className="animate-fade-in-up [animation-delay:60ms]">
        {/* Filter tabs */}
        <div className="mb-5 flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-1 w-fit">
          {(["ALL", "UNREAD"] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${activeTab === tab ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
            >
              {tab === "UNREAD" ? "Unread" : "All"}
              {tab === "UNREAD" && unreadCount > 0 && (
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          {loading ? (
            <div className="space-y-px p-2 animate-pulse">
              {[1,2,3,4].map((i) => (
                <div key={i} className="flex items-start gap-4 rounded-xl p-4">
                  <div className="h-9 w-9 shrink-0 rounded-full bg-[var(--surface-2)]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-40 rounded-full bg-[var(--surface-2)]" />
                    <div className="h-3 w-56 rounded-full bg-[var(--surface-2)]" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-2)]">
                {activeTab === "UNREAD" ? <CheckCheck className="h-6 w-6 text-green-500" /> : <Bell className="h-6 w-6 text-[var(--text-muted)]" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {activeTab === "UNREAD" ? "All caught up!" : "No notifications yet"}
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {activeTab === "UNREAD" ? "No unread notifications." : "Reminders and updates will appear here."}
                </p>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {filtered.map((notification) => {
                const meta = renderMeta(notification);
                const { icon: ToneIcon, bg, text } = TONE_META[meta.tone];
                const isUnread = !notification.read_at;
                return (
                  <li key={notification.id} className={`group flex items-start gap-4 px-5 py-4 transition-colors hover:bg-[var(--surface-container-low)] ${isUnread ? "bg-amber-50/30" : ""}`}>
                    {/* Icon */}
                    <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${bg}`}>
                      <ToneIcon className={`h-4 w-4 ${text}`} />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={`text-sm font-semibold ${isUnread ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
                          {meta.title}
                        </p>
                        {isUnread && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" aria-label="Unread" />
                        )}
                      </div>
                      {meta.detail && (
                        <p className="mt-0.5 text-xs text-[var(--text-muted)]">{meta.detail}</p>
                      )}
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                        <Clock className="h-3 w-3" />
                        {notification.sent_at ? formatRelativeTime(notification.sent_at) : "Just now"}
                      </p>
                    </div>

                    {/* Mark as read */}
                    {isUnread && (
                      <button
                        type="button"
                        onClick={() => markOneRead(notification.id)}
                        title="Mark as read"
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] opacity-0 transition-all group-hover:opacity-100 hover:bg-[var(--surface-2)] hover:text-green-600"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      </PageGridFull>
    </PageGrid>
  );
}
