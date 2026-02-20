import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "../../../../lib/supabaseAdmin";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const lookaheadHours = body?.lookaheadHours ?? Number(process.env.NOTIFICATION_LOOKAHEAD_HOURS ?? 24);
  const now = new Date();
  const cutoff = new Date(now.getTime() + lookaheadHours * 60 * 60 * 1000);

  const supabase = createSupabaseAdminClient();

  const { data: assignments, error } = await supabase
    .from("volunteer_assignments")
    .select("id, church_id, assigned_user_id, scheduled_date")
    .eq("status", "ASSIGNED")
    .gte("scheduled_date", now.toISOString().slice(0, 10))
    .lte("scheduled_date", cutoff.toISOString().slice(0, 10));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let dispatched = 0;

  for (const assignment of assignments ?? []) {
    await supabase.from("notification_log").insert({
      church_id: assignment.church_id,
      user_id: assignment.assigned_user_id,
      type: "ASSIGNMENT_REMINDER",
      payload: assignment
    });
    console.log("[Notification stub]", assignment);
    dispatched += 1;
  }

  return NextResponse.json({ dispatched });
}
