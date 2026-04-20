import { supabase } from "../supabaseClient";
import type { AssignmentStatus, Database, ServicePlanStatus } from "@gather/lib";

export type ServicePlan = Database["public"]["Tables"]["service_plans"]["Row"];
export type ServicePlanItem = Database["public"]["Tables"]["service_plan_items"]["Row"];
export type ServicePlanRoleSlot = Database["public"]["Tables"]["service_plan_role_slots"]["Row"];
export type ServicePreset = Database["public"]["Tables"]["service_presets"]["Row"];
export type ServicePresetItem = Database["public"]["Tables"]["service_preset_items"]["Row"];

export type PresetWithCount = ServicePreset & { stepCount: number };

type PresetItemCountRow = {
  preset_id: string;
};

export type PlanItemDraft = {
  id: string;
  title: string;
  duration_minutes: number | null;
  notes: string;
  owner_role_id: string | null;
  assigned_user_id: string | null;
  backup_user_id: string | null;
  status: ServicePlanStatus;
};

export type PlanRoleSlotDraft = {
  id: string;
  role_id: string;
  sort_order: number;
  assigned_user_id: string | null;
  backup_user_id: string | null;
  status: AssignmentStatus;
  notes: string;
};

/** Order slots by `churchRoles` order, then orphan role ids; reassign sort_order 0..n */
export function reindexPlanRoleSlots<T extends { id: string; role_id: string; sort_order: number }>(
  slots: T[],
  churchRoles: { id: string }[]
): T[] {
  const orderIds = churchRoles.map((r) => r.id);
  const byRole: Record<string, T[]> = {};
  for (const id of orderIds) byRole[id] = [];
  const orphans: T[] = [];
  for (const s of slots) {
    if (byRole[s.role_id] !== undefined) byRole[s.role_id].push(s);
    else orphans.push(s);
  }
  for (const id of orderIds) {
    byRole[id].sort((a, b) => a.sort_order - b.sort_order);
  }
  orphans.sort((a, b) => a.sort_order - b.sort_order);
  const merged: T[] = [];
  for (const id of orderIds) merged.push(...byRole[id]);
  merged.push(...orphans);
  return merged.map((s, index) => ({ ...s, sort_order: index }));
}

export function adjustPlanRoleSlotCount(
  slots: PlanRoleSlotDraft[],
  churchRoles: { id: string }[],
  roleId: string,
  delta: number,
  newId: () => string
): PlanRoleSlotDraft[] {
  const byRole: Record<string, PlanRoleSlotDraft[]> = {};
  for (const r of churchRoles) byRole[r.id] = [];
  const orphans: PlanRoleSlotDraft[] = [];
  for (const s of slots) {
    if (byRole[s.role_id] !== undefined) byRole[s.role_id].push(s);
    else orphans.push(s);
  }
  for (const id of Object.keys(byRole)) {
    byRole[id].sort((a, b) => a.sort_order - b.sort_order);
  }
  let list = [...(byRole[roleId] ?? [])];
  if (delta > 0) {
    for (let i = 0; i < delta; i++) {
      list.push({
        id: newId(),
        role_id: roleId,
        sort_order: 0,
        assigned_user_id: null,
        backup_user_id: null,
        status: "OPEN",
        notes: ""
      });
    }
  } else if (delta < 0) {
    list = list.slice(0, Math.max(0, list.length + delta));
  }
  byRole[roleId] = list;
  const merged: PlanRoleSlotDraft[] = [];
  for (const r of churchRoles) merged.push(...(byRole[r.id] ?? []));
  merged.push(...orphans);
  return reindexPlanRoleSlots(merged, churchRoles);
}

export async function fetchPresetsWithCounts(churchId: string, serviceTimeId: string) {
  if (!supabase) return [] as PresetWithCount[];
  const { data: presetData, error: presetError } = await supabase
    .from("service_presets")
    .select("*")
    .eq("church_id", churchId)
    .eq("service_time_id", serviceTimeId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (presetError) {
    throw new Error(presetError.message);
  }

  const presets = (presetData ?? []) as ServicePreset[];
  if (!presets.length) return [];

  const { data: itemData, error: itemError } = await supabase
    .from("service_preset_items")
    .select("id,preset_id")
    .in("preset_id", presets.map((preset: ServicePreset) => preset.id));

  if (itemError) {
    throw new Error(itemError.message);
  }

  const countRows = (itemData ?? []) as PresetItemCountRow[];
  const counts: Record<string, number> = {};
  for (const item of countRows) {
    counts[item.preset_id] = (counts[item.preset_id] ?? 0) + 1;
  }

  return presets.map((preset: ServicePreset) => ({
    ...preset,
    stepCount: counts[preset.id] ?? 0
  }));
}

export async function fetchPlanByDate(churchId: string, serviceTimeId: string, serviceDate: string) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("service_plans")
    .select("*")
    .eq("church_id", churchId)
    .eq("service_time_id", serviceTimeId)
    .eq("service_date", serviceDate)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
}

export async function fetchPlanItems(planId: string) {
  if (!supabase) return [] as ServicePlanItem[];
  const { data, error } = await supabase
    .from("service_plan_items")
    .select("*")
    .eq("plan_id", planId)
    .order("position", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function fetchPlanRoleSlots(planId: string) {
  if (!supabase) return [] as ServicePlanRoleSlot[];
  const { data, error } = await supabase
    .from("service_plan_role_slots")
    .select("*")
    .eq("plan_id", planId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createPlanRow({
  churchId,
  serviceTimeId,
  serviceDate,
  presetId,
  title
}: {
  churchId: string;
  serviceTimeId: string;
  serviceDate: string;
  presetId?: string | null;
  title?: string;
}) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("service_plans")
    .insert({
      church_id: churchId,
      service_time_id: serviceTimeId,
      service_date: serviceDate,
      preset_id: presetId ?? null,
      title: title ?? "Service Plan"
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
}

export async function replacePlanItems(planId: string, items: PlanItemDraft[]) {
  if (!supabase) return;

  // Snapshot current assignment_status so a plan edit doesn't reset confirmations
  const { data: existingItems } = await supabase
    .from("service_plan_items")
    .select("id, assignment_status")
    .eq("plan_id", planId);
  const existingRows = (existingItems ?? []) as Pick<ServicePlanItem, "id" | "assignment_status">[];
  const statusById = new Map<string, AssignmentStatus>(
    existingRows.map((i) => [i.id, (i.assignment_status ?? "OPEN") as AssignmentStatus])
  );

  const { error: deleteError } = await supabase
    .from("service_plan_items")
    .delete()
    .eq("plan_id", planId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (!items.length) return;

  const payload = items.map((item, index) => ({
    plan_id: planId,
    position: index + 1,
    title: item.title.trim() || "Untitled",
    duration_minutes: item.duration_minutes ?? null,
    notes: item.notes == null ? "" : String(item.notes).trim(),
    owner_role_id: item.owner_role_id,
    assigned_user_id: item.assigned_user_id ?? null,
    backup_user_id: item.backup_user_id ?? null,
    status: item.status,
    // Restore existing assignment_status; new items default to OPEN
    assignment_status: statusById.get(item.id) ?? "OPEN",
  }));

  const { error: insertError } = await supabase
    .from("service_plan_items")
    .insert(payload);

  if (insertError) {
    throw new Error(insertError.message);
  }
}

export async function replacePlanRoleSlots(planId: string, slots: PlanRoleSlotDraft[]) {
  if (!supabase) return;
  const { error: deleteError } = await supabase.from("service_plan_role_slots").delete().eq("plan_id", planId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  const validSlots = slots.filter((s) => s.role_id);
  if (!validSlots.length) return;

  const payload = validSlots.map((slot, index) => ({
    plan_id: planId,
    role_id: slot.role_id,
    sort_order: index,
    assigned_user_id: slot.assigned_user_id,
    backup_user_id: slot.backup_user_id,
    status: slot.status,
    notes: slot.notes?.trim() || null
  }));

  const { error: insertError } = await supabase.from("service_plan_role_slots").insert(payload);

  if (insertError) {
    throw new Error(insertError.message);
  }
}

export async function fetchPresetItems(presetId: string) {
  if (!supabase) return [] as ServicePresetItem[];
  const { data, error } = await supabase
    .from("service_preset_items")
    .select("*")
    .eq("preset_id", presetId)
    .order("position", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function fetchPreviousPlan(churchId: string, serviceTimeId: string, serviceDate: string) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("service_plans")
    .select("*")
    .eq("church_id", churchId)
    .eq("service_time_id", serviceTimeId)
    .lt("service_date", serviceDate)
    .order("service_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
}
