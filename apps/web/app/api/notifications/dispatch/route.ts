import { NextResponse } from "next/server";
import { sendEmail } from "@gather/lib";
import { createSupabaseAdminClient } from "../../../../lib/supabaseAdmin";

type ProfileRow = {
  id: string;
  email: string | null;
  disabled: boolean;
};

type ServicePlanRow = { id: string; church_id: string; service_date: string };

type PlanItemRow = {
  id: string;
  title: string;
  assigned_user_id: string;
  plan_id: string;
};

type PlanRoleSlotRow = {
  id: string;
  role_id: string;
  assigned_user_id: string;
  plan_id: string;
};

type VolunteerRoleRow = { id: string; name: string };

type DispatchRow = {
  church_id: string;
  user_id: string;
  type: "ASSIGNMENT_REMINDER";
  payload: Record<string, unknown>;
  subject: string;
  html: string;
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const lookaheadHours = body?.lookaheadHours ?? Number(process.env.NOTIFICATION_LOOKAHEAD_HOURS ?? 24);
  const targetUserId: string | undefined = typeof body?.userId === "string" ? body.userId : undefined;
  const now = new Date();
  const cutoff = new Date(now.getTime() + lookaheadHours * 60 * 60 * 1000);
  const todayStr = now.toISOString().slice(0, 10);
  const endStr = cutoff.toISOString().slice(0, 10);

  const supabase = createSupabaseAdminClient() as any;

  const { data: plans, error: plansError } = await supabase
    .from("service_plans")
    .select("id, church_id, service_date")
    .gte("service_date", todayStr)
    .lte("service_date", endStr);

  if (plansError) {
    return NextResponse.json({ error: plansError.message }, { status: 500 });
  }

  const planList = (plans ?? []) as ServicePlanRow[];
  const planById = new Map(planList.map((p) => [p.id, p]));
  const planIds = planList.map((p) => p.id);

  let planItems: PlanItemRow[] = [];
  let roleSlots: PlanRoleSlotRow[] = [];

  if (planIds.length > 0) {
    const [itemsRes, slotsRes] = await Promise.all([
      supabase
        .from("service_plan_items")
        .select("id, title, assigned_user_id, plan_id")
        .in("plan_id", planIds)
        .not("assigned_user_id", "is", null),
      supabase
        .from("service_plan_role_slots")
        .select("id, role_id, assigned_user_id, plan_id")
        .in("plan_id", planIds)
        .not("assigned_user_id", "is", null)
    ]);

    if (itemsRes.error) {
      return NextResponse.json({ error: itemsRes.error.message }, { status: 500 });
    }
    if (slotsRes.error) {
      return NextResponse.json({ error: slotsRes.error.message }, { status: 500 });
    }

    planItems = (itemsRes.data ?? []) as PlanItemRow[];
    roleSlots = (slotsRes.data ?? []) as PlanRoleSlotRow[];
  }

  const roleIds = [...new Set(roleSlots.map((s) => s.role_id))];
  let roleNameById = new Map<string, string>();
  if (roleIds.length > 0) {
    const { data: roleRows, error: rolesError } = await supabase
      .from("volunteer_roles")
      .select("id, name")
      .in("id", roleIds);
    if (rolesError) {
      return NextResponse.json({ error: rolesError.message }, { status: 500 });
    }
    roleNameById = new Map(((roleRows ?? []) as VolunteerRoleRow[]).map((r) => [r.id, r.name]));
  }

  // Don't re-notify someone about the same assignment if we already reminded them
  // recently — otherwise every click of "Send Reminders" (or a future daily cron)
  // re-inserts and re-emails a duplicate for every still-pending assignment.
  const churchIds = [...new Set(planList.map((p) => p.church_id))];
  const dedupeSince = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const alreadyNotified = new Set<string>();
  if (churchIds.length > 0) {
    const { data: recent, error: recentError } = await supabase
      .from("notification_log")
      .select("user_id, payload")
      .eq("type", "ASSIGNMENT_REMINDER")
      .in("church_id", churchIds)
      .gte("sent_at", dedupeSince);
    if (recentError) {
      return NextResponse.json({ error: recentError.message }, { status: 500 });
    }
    for (const r of (recent ?? []) as { user_id: string | null; payload: { id?: string } | null }[]) {
      if (r.user_id && r.payload?.id) alreadyNotified.add(`${r.user_id}::${r.payload.id}`);
    }
  }

  const rows: DispatchRow[] = [];

  for (const item of planItems) {
    const plan = planById.get(item.plan_id);
    if (!plan) continue;
    if (alreadyNotified.has(`${item.assigned_user_id}::${item.id}`)) continue;
    const title = item.title?.trim() || "Service part";
    rows.push({
      church_id: plan.church_id,
      user_id: item.assigned_user_id,
      type: "ASSIGNMENT_REMINDER",
      payload: {
        id: item.id,
        church_id: plan.church_id,
        assigned_user_id: item.assigned_user_id,
        scheduled_date: plan.service_date,
        source: "bulletin_part",
        part_title: title,
        plan_id: plan.id
      },
      subject: "Reminder: you’re on the service bulletin",
      html: `
      <p>You’re scheduled for a <strong>run-of-show part</strong> on the upcoming service.</p>
      <p><strong>Part:</strong> ${escapeHtml(title)}</p>
      <p><strong>Date:</strong> ${plan.service_date}</p>
      <p>Thank you for serving.</p>
    `
    });
  }

  for (const slot of roleSlots) {
    const plan = planById.get(slot.plan_id);
    if (!plan) continue;
    if (alreadyNotified.has(`${slot.assigned_user_id}::${slot.id}`)) continue;
    const roleName = roleNameById.get(slot.role_id) ?? "Serving role";
    rows.push({
      church_id: plan.church_id,
      user_id: slot.assigned_user_id,
      type: "ASSIGNMENT_REMINDER",
      payload: {
        id: slot.id,
        church_id: plan.church_id,
        assigned_user_id: slot.assigned_user_id,
        scheduled_date: plan.service_date,
        source: "bulletin_role",
        role_name: roleName,
        plan_id: plan.id
      },
      subject: "Reminder: you’re on the service bulletin",
      html: `
      <p>You’re scheduled for a <strong>role on the service plan</strong> (bulletin).</p>
      <p><strong>Role:</strong> ${escapeHtml(roleName)}</p>
      <p><strong>Date:</strong> ${plan.service_date}</p>
      <p>Thank you for serving.</p>
    `
    });
  }

  const filteredRows = targetUserId ? rows.filter((r) => r.user_id === targetUserId) : rows;
  const userIds = [...new Set(filteredRows.map((r) => r.user_id).filter(Boolean))];

  let profileByUserId = new Map<string, ProfileRow>();
  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, disabled")
      .in("id", userIds);

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    profileByUserId = new Map((profiles as ProfileRow[] | null)?.map((p) => [p.id, p]) ?? []);
  }

  let dispatched = 0;
  let emailsSent = 0;
  let emailFailures = 0;

  const sentAt = new Date().toISOString();

  for (const row of filteredRows) {
    await supabase.from("notification_log").insert({
      church_id: row.church_id,
      user_id: row.user_id,
      type: row.type,
      payload: row.payload,
      sent_at: sentAt
    });
    dispatched += 1;

    const profile = profileByUserId.get(row.user_id);
    const to = profile?.email?.trim();
    if (!to || profile?.disabled) {
      continue;
    }

    const result = await sendEmail(to, row.subject, row.html);
    if (result.ok) {
      emailsSent += 1;
    } else {
      emailFailures += 1;
      console.error("[notifications/dispatch] email failed", { to, error: result.error });
    }
  }

  return NextResponse.json({ dispatched, emailsSent, emailFailures });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
