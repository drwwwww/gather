import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "../../../../lib/supabaseAdmin";
import { getRequestUser } from "../../../../lib/apiAuth";
import { sendExpoPushNotifications, type PushMessage } from "../../../../lib/push";

export const dynamic = "force-dynamic";

/**
 * Sends the push half of live-service progress. The database trigger
 * (migration 0048) writes STEP_THANKS / STEP_PROGRESS rows with payload.push;
 * whoever runs the service (web Live Service or mobile Run service) calls this
 * right after marking a step, and it sends any unsent ones for that plan.
 */
export async function POST(request: Request) {
  const caller = await getRequestUser(request);
  if (!caller) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const { planId } = (await request.json().catch(() => ({}))) as { planId?: string };
  if (typeof planId !== "string") return NextResponse.json({ error: "Missing plan." }, { status: 400 });

  const { data: me } = await caller.supabase.from("profiles").select("church_id, role").eq("id", caller.user.id).maybeSingle();
  const profile = me as { church_id: string | null; role: string } | null;
  if (!profile?.church_id || profile.role !== "ADMIN") return NextResponse.json({ error: "Only admins run the service." }, { status: 403 });

  const db = createSupabaseAdminClient() as any;
  const { data: rows } = await db
    .from("notification_log")
    .select("id, user_id, type, payload")
    .eq("church_id", profile.church_id)
    .in("type", ["STEP_THANKS", "STEP_PROGRESS"])
    .eq("payload->>plan_id", planId)
    .eq("payload->>push", "true")
    .is("payload->>pushed", null)
    .gte("sent_at", new Date(Date.now() - 15 * 60 * 1000).toISOString());
  const pending = (rows ?? []) as { id: string; user_id: string; type: string; payload: Record<string, any> }[];
  if (pending.length === 0) return NextResponse.json({ pushed: 0 });

  const { data: tokens } = await db
    .from("profile_private")
    .select("user_id, expo_push_token")
    .in("user_id", [...new Set(pending.map((r) => r.user_id))]);
  const tokenBy = new Map(((tokens ?? []) as { user_id: string; expo_push_token: string | null }[]).map((t) => [t.user_id, t.expo_push_token]));

  const messages: PushMessage[] = [];
  for (const r of pending) {
    const to = tokenBy.get(r.user_id);
    if (!to) continue;
    if (r.type === "STEP_THANKS") {
      messages.push({ to, title: "Thank you 🙏", body: `${r.payload.title} is done. Thanks for serving today.`, data: { type: r.type, plan_id: planId } });
    } else {
      const away = Number(r.payload.steps_away ?? 1);
      messages.push({
        to,
        title: away <= 1 ? "You're up next" : "You're up soon",
        body: away <= 1
          ? `${r.payload.done_title} just finished — ${r.payload.your_title} is next.`
          : `${r.payload.done_title} just finished — ${r.payload.your_title} is ${away} steps away${r.payload.minutes_away ? ` (about ${r.payload.minutes_away} min)` : ""}.`,
        data: { type: r.type, plan_id: planId },
      });
    }
  }
  const pushed = await sendExpoPushNotifications(messages);

  // Stamp them so a second call never double-sends.
  for (const r of pending) {
    await db.from("notification_log").update({ payload: { ...r.payload, pushed: true } }).eq("id", r.id);
  }
  return NextResponse.json({ pushed });
}
