import { NextResponse } from "next/server";
import { getRequestUser } from "../../../lib/apiAuth";

export const dynamic = "force-dynamic";

/**
 * Full church data export for admins (the Terms/DPA promise). Runs as the
 * caller, so row-level security decides what's included — it can never
 * reach another church's data.
 */
export async function GET(request: Request) {
  const caller = await getRequestUser(request);
  if (!caller) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const db = caller.supabase as any;
  const { data: me } = await db.from("profiles").select("church_id, role").eq("id", caller.user.id).maybeSingle();
  if (!me?.church_id || me.role !== "ADMIN") return NextResponse.json({ error: "Only church admins can export." }, { status: 403 });
  const cid = me.church_id as string;

  const byChurch = (table: string, cols = "*") => db.from(table).select(cols).eq("church_id", cid);
  const [church, profiles, serviceTimes, roles, presets, plans, announcements, events, serveRequests, away] = await Promise.all([
    db.from("churches").select("id, name, slug, timezone, address, worship_days, created_at, plan").eq("id", cid).maybeSingle(),
    byChurch("profiles", "id, full_name, email, role, disabled, created_at, favorite_verse, ministry_interests"),
    byChurch("service_times"),
    byChurch("volunteer_roles"),
    byChurch("service_presets"),
    byChurch("service_plans"),
    byChurch("announcements"),
    byChurch("events"),
    byChurch("serve_requests"),
    byChurch("volunteer_unavailability"),
  ]);

  const ids = (res: any) => ((res.data ?? []) as { id: string }[]).map((r) => r.id);
  const inChunks = async (table: string, col: string, values: string[]) => {
    const out: unknown[] = [];
    for (let i = 0; i < values.length; i += 150) {
      const { data } = await db.from(table).select("*").in(col, values.slice(i, i + 150));
      out.push(...(data ?? []));
    }
    return out;
  };
  const memberIds = ids(profiles);
  const [privateRows, presetItems, planSlots, planItems, rsvps] = await Promise.all([
    inChunks("profile_private", "user_id", memberIds),
    inChunks("service_preset_items", "preset_id", ids(presets)),
    inChunks("service_plan_role_slots", "plan_id", ids(plans)),
    inChunks("service_plan_items", "plan_id", ids(plans)),
    inChunks("event_rsvps", "event_id", ids(events)),
  ]);
  // Phone numbers only — device push tokens are not church data.
  const phones = (privateRows as { user_id: string; phone: string | null }[]).map((r) => ({ user_id: r.user_id, phone: r.phone ?? null }));

  const payload = {
    exported_at: new Date().toISOString(),
    church: church.data,
    people: profiles.data ?? [],
    phones,
    service_times: serviceTimes.data ?? [],
    volunteer_roles: roles.data ?? [],
    service_presets: presets.data ?? [],
    service_preset_items: presetItems,
    service_plans: plans.data ?? [],
    service_plan_role_slots: planSlots,
    service_plan_items: planItems,
    announcements: announcements.data ?? [],
    events: events.data ?? [],
    event_rsvps: rsvps,
    serve_requests: serveRequests.data ?? [],
    volunteer_unavailability: away.data ?? [],
  };

  const slug = (church.data?.slug as string | undefined) ?? "church";
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="gather-${slug}-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
