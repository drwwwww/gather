import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "../../../../lib/supabaseAdmin";
import { getRequestUser } from "../../../../lib/apiAuth";
import { sendExpoPushNotifications, type PushMessage } from "../../../../lib/push";

export const dynamic = "force-dynamic";

/**
 * Live Service → "Send a kind note": a warm, no-reply-needed message to
 * everyone scheduled for a finished service who never checked in. The server
 * recomputes who that is (the client only names the plan) and sends once per
 * service (service_plans.care_note_sent_at).
 */
export async function POST(request: Request) {
  const caller = await getRequestUser(request);
  if (!caller) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const { planId } = (await request.json().catch(() => ({}))) as { planId?: string };
  if (typeof planId !== "string") return NextResponse.json({ error: "Missing plan." }, { status: 400 });

  const { data: me } = await caller.supabase.from("profiles").select("church_id, role").eq("id", caller.user.id).maybeSingle();
  const profile = me as { church_id: string | null; role: string } | null;
  if (!profile?.church_id || profile.role !== "ADMIN") return NextResponse.json({ error: "Only admins can send this." }, { status: 403 });

  const db = createSupabaseAdminClient() as any;
  const { data: plan } = await db
    .from("service_plans")
    .select("id, church_id, title, service_time_id, care_note_sent_at")
    .eq("id", planId)
    .maybeSingle();
  if (!plan || plan.church_id !== profile.church_id) return NextResponse.json({ error: "Service not found." }, { status: 404 });
  if (plan.care_note_sent_at) return NextResponse.json({ error: "A note already went out for this service." }, { status: 409 });

  const [slotsRes, itemsRes, timeRes] = await Promise.all([
    db.from("service_plan_role_slots").select("assigned_user_id, status, checked_in_at").eq("plan_id", planId),
    db.from("service_plan_items").select("assigned_user_id, assignment_status, checked_in_at").eq("plan_id", planId),
    plan.service_time_id ? db.from("service_times").select("name").eq("id", plan.service_time_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const scheduled = new Set<string>();
  const here = new Set<string>();
  for (const s of slotsRes.data ?? []) {
    if (!s.assigned_user_id || s.status === "DECLINED") continue;
    scheduled.add(s.assigned_user_id);
    if (s.checked_in_at) here.add(s.assigned_user_id);
  }
  for (const i of itemsRes.data ?? []) {
    if (!i.assigned_user_id || i.assignment_status === "DECLINED") continue;
    scheduled.add(i.assigned_user_id);
    if (i.checked_in_at) here.add(i.assigned_user_id);
  }
  // Never send yourself a "we missed you".
  const recipients = [...scheduled].filter((id) => !here.has(id) && id !== caller.user.id);
  if (recipients.length === 0) return NextResponse.json({ error: "Everyone checked in." }, { status: 400 });

  const serviceName = (timeRes.data as { name?: string } | null)?.name || plan.title || "the service";
  const title = "We missed you today";
  const body = `We missed you at ${serviceName} today. Hope everything's okay — no need to reply.`;
  const sentAt = new Date().toISOString();

  await db.from("notification_log").insert(
    recipients.map((user_id) => ({
      church_id: plan.church_id,
      user_id,
      type: "CARE_NOTE",
      payload: { plan_id: planId, title, message: body },
      sent_at: sentAt,
    }))
  );

  const { data: tokens } = await db.from("profile_private").select("user_id, expo_push_token").in("user_id", recipients);
  const messages: PushMessage[] = ((tokens ?? []) as { user_id: string; expo_push_token: string | null }[])
    .filter((t) => t.expo_push_token)
    .map((t) => ({ to: t.expo_push_token as string, title, body, data: { type: "CARE_NOTE", plan_id: planId } }));
  const pushed = await sendExpoPushNotifications(messages);

  await db.from("service_plans").update({ care_note_sent_at: sentAt }).eq("id", planId);
  return NextResponse.json({ sentTo: recipients.length, pushed });
}
