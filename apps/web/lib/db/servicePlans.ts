import { supabase } from "../supabaseClient";
import type { Database, ServicePlanStatus } from "@gather/lib";

export type ServicePlan = Database["public"]["Tables"]["service_plans"]["Row"];
export type ServicePlanItem = Database["public"]["Tables"]["service_plan_items"]["Row"];
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
  status: ServicePlanStatus;
};

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
    notes: item.notes ?? "",
    owner_role_id: item.owner_role_id,
    status: item.status
  }));

  const { error: insertError } = await supabase
    .from("service_plan_items")
    .insert(payload);

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
