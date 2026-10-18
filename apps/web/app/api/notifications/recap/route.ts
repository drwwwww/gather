import { NextResponse } from "next/server";
import { sendEmail } from "@gather/lib";
import { createSupabaseAdminClient } from "../../../../lib/supabaseAdmin";
import { getRequestUser } from "../../../../lib/apiAuth";
import { escapeHtml, sendExpoPushNotifications, type PushMessage } from "../../../../lib/push";

export const dynamic = "force-dynamic";

/**
 * Post-service thank-you to everyone who served. Church admins only, once per
 * plan, and only on or after the service date.
 */
export async function POST(request: Request) {
  const caller = await getRequestUser(request);
  if (!caller) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { planId?: string };
  if (typeof body.planId !== "string") return NextResponse.json({ error: "Missing plan." }, { status: 400 });

  const { data: me } = await caller.supabase
    .from("profiles")
    .select("church_id, role, disabled")
    .eq("id", caller.user.id)
    .maybeSingle();
  const profile = me as { church_id: string | null; role: string; disabled: boolean } | null;
  if (!profile?.church_id || profile.role !== "ADMIN" || profile.disabled) {
    return NextResponse.json({ error: "Only church admins can send a recap." }, { status: 403 });
  }

  const db = createSupabaseAdminClient() as any;
  const { data: plan } = await db
    .from("service_plans")
    .select("id, church_id, title, service_date, recap_sent_at")
    .eq("id", body.planId)
    .maybeSingle();
  if (!plan || plan.church_id !== profile.church_id) return NextResponse.json({ error: "Service not found." }, { status: 404 });
  if (plan.recap_sent_at) return NextResponse.json({ error: "A recap was already sent for this service." }, { status: 409 });

  const { data: church } = await db.from("churches").select("name, timezone").eq("id", plan.church_id).maybeSingle();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: church?.timezone || "America/New_York" });
  if (plan.service_date > today) return NextResponse.json({ error: "Send the recap after the service." }, { status: 400 });

  const [slotsRes, itemsRes] = await Promise.all([
    db.from("service_plan_role_slots").select("assigned_user_id, status, checked_in_at").eq("plan_id", plan.id),
    db.from("service_plan_items").select("assigned_user_id, assignment_status, status, checked_in_at").eq("plan_id", plan.id),
  ]);
  const slots = (slotsRes.data ?? []) as { assigned_user_id: string | null; status: string; checked_in_at: string | null }[];
  const items = (itemsRes.data ?? []) as { assigned_user_id: string | null; assignment_status: string | null; status: string; checked_in_at: string | null }[];

  const team = new Set<string>();
  for (const s of slots) if (s.assigned_user_id && s.status !== "DECLINED") team.add(s.assigned_user_id);
  for (const i of items) if (i.assigned_user_id && i.assignment_status !== "DECLINED") team.add(i.assigned_user_id);
  if (team.size === 0) return NextResponse.json({ error: "No one was scheduled for this service." }, { status: 400 });

  const partsDone = items.filter((i) => i.status === "DONE").length;
  const weekday = new Date(`${plan.service_date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long" });
  const title = `Thank you for serving ${weekday}`;
  const partsLine = items.length > 0 ? ` ${partsDone} of ${items.length} parts of the service ran.` : "";
  const message = `${team.size} people served at ${plan.title || "the service"}.${partsLine} It doesn't happen without you.`;

  const userIds = [...team];
  const [profilesRes, privateRes] = await Promise.all([
    db.from("profiles").select("id, email, disabled").in("id", userIds),
    db.from("profile_private").select("user_id, expo_push_token").in("user_id", userIds),
  ]);
  const tokenBy = new Map<string, string | null>(((privateRes.data ?? []) as { user_id: string; expo_push_token: string | null }[]).map((r) => [r.user_id, r.expo_push_token]));
  const sentAt = new Date().toISOString();
  const payload = { plan_id: plan.id, title, message, served: team.size, parts_done: partsDone, parts_total: items.length };

  await db.from("notification_log").insert(
    userIds.map((user_id) => ({ church_id: plan.church_id, user_id, type: "SERVICE_RECAP", payload, sent_at: sentAt }))
  );

  const push: PushMessage[] = [];
  let emailsSent = 0;
  for (const p of (profilesRes.data ?? []) as { id: string; email: string | null; disabled: boolean }[]) {
    if (p.disabled) continue;
    const token = tokenBy.get(p.id);
    if (token) push.push({ to: token, title, body: message, data: { type: "SERVICE_RECAP", plan_id: plan.id } });
    if (p.email) {
      const res = await sendEmail(
        p.email,
        title,
        `<p>${escapeHtml(message)}</p><p>— ${escapeHtml(church?.name ?? "Your church")}</p>`
      );
      if (res.ok) emailsSent++;
    }
  }
  const pushSent = await sendExpoPushNotifications(push);
  await db.from("service_plans").update({ recap_sent_at: sentAt }).eq("id", plan.id);

  return NextResponse.json({ sentTo: team.size, emailsSent, pushSent });
}
