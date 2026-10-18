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

/** Fetch presets for a church, optionally filtered by worship_day (0=Sun…6=Sat). */
export async function fetchPresetsWithCounts(churchId: string, worshipDay?: number) {
  if (!supabase) return [] as PresetWithCount[];
  let query = supabase
    .from("service_presets")
    .select("*")
    .eq("church_id", churchId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  if (worshipDay !== undefined) {
    query = query.eq("worship_day", worshipDay);
  }
  const { data: presetData, error: presetError } = await query;

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

export async function fetchAllPlansForDate(churchId: string, serviceDate: string): Promise<ServicePlan[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("service_plans")
    .select("*")
    .eq("church_id", churchId)
    .eq("service_date", serviceDate)
    .order("start_time", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchPlanByDate(churchId: string, serviceDate: string) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("service_plans")
    .select("*")
    .eq("church_id", churchId)
    .eq("service_date", serviceDate)
    .order("created_at", { ascending: false })
    .limit(1)
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

  rememberPlanRows(planId, { items: data ?? [] });
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

  rememberPlanRows(planId, { slots: data ?? [] });
  return data ?? [];
}

export async function createPlanRow({
  churchId,
  serviceDate,
  presetId,
  title,
  startTime,
  serviceTimeId,
}: {
  churchId: string;
  serviceDate: string;
  presetId?: string | null;
  title?: string;
  startTime?: string | null;
  serviceTimeId?: string | null;
}) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("service_plans")
    .insert({
      church_id: churchId,
      service_date: serviceDate,
      preset_id: presetId ?? null,
      title: title ?? "Service Plan",
      start_time: startTime ?? null,
      service_time_id: serviceTimeId ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A v4 UUID for new editor rows — also on plain-http LAN hosts where crypto.randomUUID is unavailable. */
export function newRowId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  const b = new Uint8Array(16);
  (globalThis.crypto as Crypto).getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

type ItemFields = {
  position: number; title: string; duration_minutes: number | null; notes: string;
  owner_role_id: string | null; assigned_user_id: string | null; backup_user_id: string | null; status: string;
};
type SlotFields = {
  role_id: string; sort_order: number; assigned_user_id: string | null; backup_user_id: string | null;
  status: string; notes: string | null;
};
const ITEM_COLS = "id, position, title, duration_minutes, notes, owner_role_id, assigned_user_id, backup_user_id, status";
const SLOT_COLS = "id, role_id, sort_order, assigned_user_id, backup_user_id, status, notes";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

const itemFields = (r: AnyRow): ItemFields => ({
  position: r.position, title: r.title ?? "", duration_minutes: r.duration_minutes ?? null, notes: r.notes ?? "",
  owner_role_id: r.owner_role_id ?? null, assigned_user_id: r.assigned_user_id ?? null,
  backup_user_id: r.backup_user_id ?? null, status: r.status ?? "PLANNED",
});
const slotFields = (r: AnyRow): SlotFields => ({
  role_id: r.role_id, sort_order: r.sort_order ?? 0, assigned_user_id: r.assigned_user_id ?? null,
  backup_user_id: r.backup_user_id ?? null, status: r.status ?? "OPEN", notes: r.notes?.trim() || null,
});

/**
 * What this editor last loaded or saved, per plan. Saves send only the
 * fields the admin changed relative to this baseline, so answers, backup
 * promotions, step-downs and check-ins that happened elsewhere since the
 * editor loaded are never overwritten with stale values, and rows another
 * admin added are never deleted.
 */
const baselines = new Map<string, { items?: Map<string, ItemFields>; slots?: Map<string, SlotFields> }>();

/** Call with the rows an editor just loaded (fetchPlanItems/fetchPlanRoleSlots do this for you). */
export function rememberPlanRows(planId: string, rows: { items?: AnyRow[]; slots?: AnyRow[] }) {
  const b = baselines.get(planId) ?? {};
  if (rows.items) b.items = new Map(rows.items.map((r) => [r.id as string, itemFields(r)]));
  if (rows.slots) b.slots = new Map(rows.slots.map((r) => [r.id as string, slotFields(r)]));
  baselines.set(planId, b);
}

/** One save at a time per plan: overlapping autosaves would both insert the same new row. */
const queues = new Map<string, Promise<unknown>>();
function serialize<T>(key: string, run: () => Promise<T>): Promise<T> {
  const next = (queues.get(key) ?? Promise.resolve()).catch(() => {}).then(run);
  queues.set(key, next);
  return next;
}

function diff<T extends Record<string, unknown>>(next: T, base: T): Partial<T> {
  const patch: Partial<T> = {};
  (Object.keys(next) as (keyof T)[]).forEach((k) => {
    if (next[k] !== base[k]) patch[k] = next[k];
  });
  return patch;
}

async function syncRows<F extends Record<string, unknown>>(opts: {
  table: "service_plan_items" | "service_plan_role_slots";
  planId: string;
  cols: string;
  drafts: { id: string; fields: F }[];
  baseline: () => Map<string, F> | undefined;
  setBaseline: (m: Map<string, F>) => void;
  normalize: (r: AnyRow) => F;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any;
  let base = opts.baseline();
  if (!base) {
    // The editor never registered what it loaded: fall back to the current rows.
    const { data, error } = await client.from(opts.table).select(opts.cols).eq("plan_id", opts.planId);
    if (error) throw new Error(error.message);
    base = new Map(((data ?? []) as AnyRow[]).map((r) => [r.id as string, opts.normalize(r)]));
  }
  const next = new Map(base);
  const seen = new Set<string>();

  for (const { id, fields } of opts.drafts) {
    seen.add(id);
    const prev = base.get(id);
    if (prev) {
      const patch = diff(fields, prev);
      if (!Object.keys(patch).length) continue;
      const { data, error } = await client.from(opts.table).update(patch).eq("id", id).select(opts.cols).maybeSingle();
      if (error) throw new Error(error.message);
      // Deleted elsewhere since load: do not resurrect it.
      if (data) next.set(id, opts.normalize(data));
      else next.delete(id);
    } else {
      const { data, error } = await client
        .from(opts.table)
        .insert({ ...(UUID.test(id) ? { id } : {}), plan_id: opts.planId, ...fields })
        .select(opts.cols)
        .single();
      if (error) throw new Error(error.message);
      next.set(id, opts.normalize(data));
    }
  }

  // Only rows this editor knew about and the admin removed, never rows added elsewhere.
  const removed = [...base.keys()].filter((id) => !seen.has(id));
  if (removed.length) {
    const { error } = await client.from(opts.table).delete().in("id", removed);
    if (error) throw new Error(error.message);
    removed.forEach((id) => next.delete(id));
  }
  opts.setBaseline(next);
}

/**
 * Saves the editor's run-of-show in place (update changed / insert new /
 * delete removed). It used to delete and re-insert every row on each
 * autosave, which changed every id, wiped check-ins, overwrote answers and
 * could lose the plan if the insert failed. Status rules (person swapped to
 * pending, decline promotes the backup, new rows start unanswered) are
 * enforced by the normalize_schedule_row trigger.
 */
export function replacePlanItems(planId: string, items: PlanItemDraft[]): Promise<void> {
  if (!supabase) return Promise.resolve();
  return serialize(`items:${planId}`, () =>
    syncRows<ItemFields>({
      table: "service_plan_items",
      planId,
      cols: ITEM_COLS,
      drafts: items.map((item, index) => ({
        id: item.id,
        fields: itemFields({
          ...item,
          position: index + 1,
          title: item.title.trim() || "Untitled",
          notes: item.notes == null ? "" : String(item.notes).trim(),
        }),
      })),
      baseline: () => baselines.get(planId)?.items,
      setBaseline: (m) => baselines.set(planId, { ...baselines.get(planId), items: m }),
      normalize: itemFields,
    })
  );
}

/** Same in-place sync for role slots. See replacePlanItems. */
export function replacePlanRoleSlots(planId: string, slots: PlanRoleSlotDraft[]): Promise<void> {
  if (!supabase) return Promise.resolve();
  return serialize(`slots:${planId}`, () =>
    syncRows<SlotFields>({
      table: "service_plan_role_slots",
      planId,
      cols: SLOT_COLS,
      drafts: slots
        .filter((s) => s.role_id)
        .map((slot, index) => ({ id: slot.id, fields: slotFields({ ...slot, sort_order: index }) })),
      baseline: () => baselines.get(planId)?.slots,
      setBaseline: (m) => baselines.set(planId, { ...baselines.get(planId), slots: m }),
      normalize: slotFields,
    })
  );
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

export async function fetchPreviousPlan(churchId: string, serviceDate: string) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("service_plans")
    .select("*")
    .eq("church_id", churchId)
    .lt("service_date", serviceDate)
    .order("service_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
}
