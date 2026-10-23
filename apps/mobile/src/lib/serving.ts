/**
 * The signed-in person's upcoming serving — shared by Serve (the list) and
 * AssignmentDetail (one assignment). Answers always go through the
 * respond_assignment RPC, where the primary/backup and past-service rules live.
 */

export type ServeSource = "bulletin_role" | "bulletin_part";

export type ServeRow = {
  key: string;
  source: ServeSource;
  /** service_plan_role_slots.id or service_plan_items.id */
  id: string;
  planId: string;
  date: string;
  startTime: string | null;
  serviceName: string | null;
  title: string;
  status: string;
  isBackup: boolean;
};

export type ServeData = {
  rows: ServeRow[];
  /** First names of everyone else serving in each plan. */
  teammates: Record<string, string[]>;
};

const pad = (n: number) => String(n).padStart(2, "0");
export const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** "9:00 AM" from "09:00" / "09:00:00". */
export function clock(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${pad(m || 0)} ${h >= 12 ? "PM" : "AM"}`;
}

/** Minutes after a "HH:MM" start, as "HH:MM" (same day). */
export function addMinutes(t: string, minutes: number): string {
  const [h, m] = t.split(":").map(Number);
  const total = Math.max(0, h * 60 + (m || 0) + minutes);
  return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;
}

/** Volunteers are asked to be ready 15 minutes before the service (same rule as the bulletin). */
export const readyBy = (startTime: string | null) => (startTime ? clock(addMinutes(startTime, -15)) : null);

export function dateParts(date: string) {
  const d = new Date(`${date}T12:00:00`);
  return {
    weekdayShort: d.toLocaleDateString("en-US", { weekday: "short" }),
    weekdayLong: d.toLocaleDateString("en-US", { weekday: "long" }),
    monthShort: d.toLocaleDateString("en-US", { month: "short" }),
    day: d.getDate(),
    long: d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
    short: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  };
}

/** "10:00 Combined service" style label: the service's name and time, whichever exist. */
export const serviceLine = (r: Pick<ServeRow, "serviceName" | "startTime">) =>
  [r.startTime ? clock(r.startTime) : null, r.serviceName].filter(Boolean).join(" · ") || "Service";

/** Only the person serving owes an answer; a backup's row mirrors the primary. */
export const needsAnswer = (r: ServeRow) => !r.isBackup && r.status !== "CONFIRMED" && r.status !== "DECLINED";

export async function loadMyServing(client: any, userId: string, churchId: string): Promise<ServeData> {
  const today = localToday();
  const { data: plansData } = await client
    .from("service_plans")
    .select("id, title, service_date, start_time, service_time_id")
    .eq("church_id", churchId)
    .gte("service_date", today)
    .order("service_date", { ascending: true })
    .limit(40);
  type Plan = { id: string; title: string | null; service_date: string; start_time: string | null; service_time_id: string | null };
  const plans = (plansData ?? []) as Plan[];
  if (plans.length === 0) return { rows: [], teammates: {} };
  const planIds = plans.map((p) => p.id);
  const planById = new Map(plans.map((p) => [p.id, p]));

  const timeIds = [...new Set(plans.map((p) => p.service_time_id).filter(Boolean))];
  const [timesRes, slotsRes, itemsRes] = await Promise.all([
    timeIds.length ? client.from("service_times").select("id, name").in("id", timeIds) : Promise.resolve({ data: [] }),
    client.from("service_plan_role_slots").select("id, role_id, plan_id, status, assigned_user_id, backup_user_id").in("plan_id", planIds),
    client.from("service_plan_items").select("id, title, plan_id, assignment_status, assigned_user_id, backup_user_id").in("plan_id", planIds),
  ]);
  const serviceName = new Map(((timesRes.data ?? []) as { id: string; name: string }[]).map((t) => [t.id, t.name]));
  type Slot = { id: string; role_id: string; plan_id: string; status: string; assigned_user_id: string | null; backup_user_id: string | null };
  type Item = { id: string; title: string | null; plan_id: string; assignment_status: string | null; assigned_user_id: string | null; backup_user_id: string | null };
  const slots = (slotsRes.data ?? []) as Slot[];
  const items = (itemsRes.data ?? []) as Item[];

  const mine = (r: { assigned_user_id: string | null; backup_user_id: string | null }) =>
    r.assigned_user_id === userId || r.backup_user_id === userId;
  const roleIds = [...new Set(slots.filter(mine).map((s) => s.role_id))];
  const peopleIds = [...new Set([...slots, ...items].map((r) => r.assigned_user_id).filter((id): id is string => !!id && id !== userId))];
  const [rolesRes, peopleRes] = await Promise.all([
    roleIds.length ? client.from("volunteer_roles").select("id, name").in("id", roleIds) : Promise.resolve({ data: [] }),
    peopleIds.length ? client.from("profiles").select("id, full_name, email").in("id", peopleIds) : Promise.resolve({ data: [] }),
  ]);
  const roleName = new Map(((rolesRes.data ?? []) as { id: string; name: string }[]).map((r) => [r.id, r.name]));
  const firstName = new Map(
    ((peopleRes.data ?? []) as { id: string; full_name: string | null; email: string | null }[]).map((p) => [
      p.id,
      (p.full_name?.trim() || p.email?.split("@")[0] || "Someone").split(/\s+/)[0],
    ])
  );

  const rows: ServeRow[] = [];
  const base = (planId: string) => {
    const p = planById.get(planId)!;
    return {
      planId,
      date: p.service_date,
      startTime: p.start_time,
      serviceName: (p.service_time_id && serviceName.get(p.service_time_id)) || p.title?.trim() || null,
    };
  };
  for (const s of slots.filter(mine)) {
    const isBackup = s.backup_user_id === userId && s.assigned_user_id !== userId;
    rows.push({ key: `r-${s.id}${isBackup ? "-b" : ""}`, source: "bulletin_role", id: s.id, ...base(s.plan_id), title: roleName.get(s.role_id) ?? "Role", status: s.status, isBackup });
  }
  for (const i of items.filter(mine)) {
    const isBackup = i.backup_user_id === userId && i.assigned_user_id !== userId;
    rows.push({ key: `i-${i.id}${isBackup ? "-b" : ""}`, source: "bulletin_part", id: i.id, ...base(i.plan_id), title: i.title?.trim() || "Part of the service", status: i.assignment_status ?? "ASSIGNED", isBackup });
  }
  rows.sort((a, b) => a.date.localeCompare(b.date) || (a.startTime ?? "").localeCompare(b.startTime ?? "") || (a.source === b.source ? 0 : a.source === "bulletin_role" ? -1 : 1));

  const teammates: Record<string, string[]> = {};
  for (const r of [...slots, ...items]) {
    if (!r.assigned_user_id || r.assigned_user_id === userId) continue;
    const name = firstName.get(r.assigned_user_id);
    if (!name) continue;
    const list = (teammates[r.plan_id] ??= []);
    if (!list.includes(name)) list.push(name);
  }
  return { rows, teammates };
}

/** Confirm / decline (or a backup stepping down). Returns a plain-language error, or null. */
export async function respondTo(client: any, row: Pick<ServeRow, "source" | "id">, response: "CONFIRMED" | "DECLINED") {
  const { data, error } = await client.rpc("respond_assignment", {
    p_source: row.source === "bulletin_role" ? "plan_role_slot" : "plan_item",
    p_id: row.id,
    p_response: response,
  });
  if (error) return { error: "Couldn't save your answer. Check your connection and try again.", promoted: false };
  if (data?.error) {
    const e = String(data.error);
    return { error: e === "permission denied" ? "You're no longer on this." : e === "not found" ? "This was changed by your team. Pull to refresh." : e, promoted: false };
  }
  return { error: null, promoted: data?.promoted === true };
}

/** "with Miriam, Junia +3" */
export function withLine(names: string[] | undefined): string | null {
  if (!names || names.length === 0) return null;
  const shown = names.slice(0, 2).join(", ");
  return names.length > 2 ? `with ${shown} +${names.length - 2}` : `with ${shown}`;
}
