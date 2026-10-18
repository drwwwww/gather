"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminHeader from "../../../../../components/admin/AdminHeader";
import PageLoader from "../../../../../components/ui/PageLoader";
import ServicePlanStepsEditor from "../../../../../components/servicePlans/ServicePlanStepsEditor";
import ServicePlanRoleSlotsSection from "../../../../../components/servicePlans/ServicePlanRoleSlotsSection";
import { PageGrid, PageGridFull } from "../../../../../components/layout/PageGrid";
import { getCurrentContext } from "../../../../../lib/supabaseData";
import { useChurchPlan } from "../../../../../lib/plan";
import { AiButton } from "../../../../../components/ai/AiBrand";
import AiFillDialog from "../../../../../components/ai/AiFillDialog";
import { supabase } from "../../../../../lib/supabaseClient";
import {
  fetchPlanRoleSlots,
  replacePlanItems,
  replacePlanRoleSlots,
  adjustPlanRoleSlotCount,
  reindexPlanRoleSlots,
  type PlanItemDraft,
  type PlanRoleSlotDraft,
  type ServicePlanRoleSlot,
  newRowId,
  rememberPlanRows
} from "../../../../../lib/db/servicePlans";
import type { Database, ServicePlanStatus } from "@gather/lib";

type ServicePlan = Database["public"]["Tables"]["service_plans"]["Row"];
type PlanItemRow = Database["public"]["Tables"]["service_plan_items"]["Row"];
type RoleRow = Database["public"]["Tables"]["volunteer_roles"]["Row"];

type PlanItem = PlanItemDraft;

type PageState = "loading" | "ready" | "restricted";

// Real UUIDs (also on plain-http LAN hosts): saves reuse them as row ids.
const createLocalId = () => newRowId();

export default function ServicePlanEditorPage() {
  const params = useParams<{ planId: string }>();
  const planId = params?.planId;
  const [plan, setPlan] = useState<ServicePlan | null>(null);
  const [items, setItems] = useState<PlanItem[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [members, setMembers] = useState<{ id: string; full_name: string | null; email: string | null }[]>([]);
  const [roleSlotDrafts, setRoleSlotDrafts] = useState<PlanRoleSlotDraft[]>([]);
  const [presetName, setPresetName] = useState<string | null>(null);
  const [status, setStatus] = useState<PageState>("loading");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const { aiEnabled } = useChurchPlan();
  const [aiOpen, setAiOpen] = useState(false);
  const [awayIds, setAwayIds] = useState<Set<string>>(new Set());

  // Volunteers → "Fill with AI" lands here with ?ai=1.
  useEffect(() => {
    if (aiEnabled && status === "ready" && new URLSearchParams(window.location.search).get("ai") === "1") {
      setAiOpen(true);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [aiEnabled, status]);

  const title = useMemo(() => plan?.title || "Service Plan", [plan]);

  const loadPlan = async (churchId: string) => {
    if (!supabase || !planId) return;
    const [{ data: planData, error: planError }, { data: itemData, error: itemError }, { data: roleData }] = await Promise.all([
      supabase.from("service_plans").select("*").eq("id", planId).single(),
      supabase.from("service_plan_items").select("*").eq("plan_id", planId).order("position"),
      supabase.from("volunteer_roles").select("*").eq("church_id", churchId).order("name")
    ]);

    if (planError || !planData) {
      setError(planError?.message ?? "Plan not found.");
      return;
    }

    if (itemError) {
      setError(itemError.message);
      return;
    }

    if (planData.church_id !== churchId) {
      setError("Plan not found.");
      return;
    }

    let slotRows: ServicePlanRoleSlot[] = [];
    try {
      slotRows = await fetchPlanRoleSlots(planId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load role slots.");
      return;
    }

    // Register what this editor loaded so saves only send what the admin changed.
    rememberPlanRows(planId, { items: itemData ?? [] });
    setError(null);
    setPlan(planData);
    setRoles(roleData ?? []);
    setRoleSlotDrafts(mapRoleSlotRows(slotRows));
    setItems(
      (itemData ?? []).map((item: PlanItemRow) => ({
        id: item.id,
        title: item.title,
        duration_minutes: item.duration_minutes,
        notes: item.notes ?? "",
        owner_role_id: item.owner_role_id,
        assigned_user_id: item.assigned_user_id ?? null,
        backup_user_id: item.backup_user_id ?? null,
        status: item.status as ServicePlanStatus
      }))
    );

    if (planData.preset_id) {
      const { data: presetData } = await supabase
        .from("service_presets")
        .select("id, name")
        .eq("id", planData.preset_id)
        .maybeSingle();
      setPresetName(presetData?.name ?? null);
    } else {
      setPresetName(null);
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!supabase) return;
      const context = await getCurrentContext();
      if (!context) {
        router.push("/login");
        return;
      }
      if (context.profile.role !== "ADMIN") {
        setStatus("restricted");
        return;
      }
      await loadPlan(context.profile.church_id);
      setStatus("ready");
      hasLoadedRef.current = true;
    };

    load();
  }, [router, planId]);

  useEffect(() => {
    if (!supabase || !plan?.church_id) {
      setMembers([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("church_id", plan.church_id)
        .eq("disabled", false)
        .order("full_name", { ascending: true });
      if (!cancelled && !error && data) {
        setMembers(data);
      }
      if (plan.service_date) {
        const { data: away } = await (supabase as any)
          .from("volunteer_unavailability")
          .select("user_id")
          .eq("church_id", plan.church_id)
          .lte("start_date", plan.service_date)
          .gte("end_date", plan.service_date);
        if (!cancelled) setAwayIds(new Set((away ?? []).map((a: { user_id: string }) => a.user_id)));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [plan?.church_id, plan?.service_date]);

  const handleAddItem = (title = "") => {
    setItems((prev) => [
      ...prev,
      {
        id: createLocalId(),
        title,
        duration_minutes: null,
        notes: "",
        owner_role_id: null,
        assigned_user_id: null,
        backup_user_id: null,
        status: "PLANNED"
      }
    ]);
  };


  const handleSave = useCallback(async () => {
    if (!supabase || !plan || !planId) return;
    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("service_plans")
      .update({ title: plan.title ?? "" })
      .eq("id", planId);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    try {
      await replacePlanItems(planId, items);
      await replacePlanRoleSlots(planId, roleSlotDrafts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
      setSaving(false);
      return;
    }

    setSaving(false);
    setLastSaved(new Date());
  }, [supabase, plan, planId, items, roleSlotDrafts]);

  // Debounced autosave — fires 1.5 s after the last change, but only after the initial load
  useEffect(() => {
    if (!hasLoadedRef.current) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => { void handleSave(); }, 1500);
    return () => { if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current); };
  }, [items, roleSlotDrafts, handleSave]);

  // Keep a ref to the latest autosave so the unmount/unload handlers below never
  // close over a stale `items`/`roleSlotDrafts` snapshot from an earlier render.
  const handleSaveRef = useRef(handleSave);
  useEffect(() => { handleSaveRef.current = handleSave; }, [handleSave]);

  // In-app navigation away (e.g. clicking a nav link): a pending debounce timer
  // gets cancelled by the effect cleanup above with nothing to catch it. Flush
  // it here instead of losing the edit — the fetch survives an SPA unmount.
  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
        void handleSaveRef.current();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- unmount-only; latest save reached via handleSaveRef
  }, []);

  // Closing the tab / hard navigation: an in-flight or about-to-fire autosave
  // can't be guaranteed to complete, so warn instead of silently losing it.
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (autosaveTimerRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  if (status === "loading") {
    return (
      <PageGrid className="animate-pulse-subtle">
        <PageGridFull className="space-y-4">
          <div className="h-8 w-48 rounded-md bg-[var(--surface-2)]" />
          <div className="h-4 w-64 rounded-md bg-[var(--surface-2)]" />
        </PageGridFull>
        <PageGridFull>
          <div className="card h-[600px] bg-[var(--surface)]" />
        </PageGridFull>
      </PageGrid>
    );
  }

  if (status === "restricted") {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-4 px-6">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center w-full">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Access restricted</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Only admins can manage service plans.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <PageGrid>
      <PageGridFull className="animate-fade-in-up">
        <AdminHeader
          back={{ href: "/admin/service-plans", label: "Service plans" }}
          title={title}
          subtitle="Adjust this service plan without changing the preset."
        />
      </PageGridFull>
      <PageGridFull className="animate-fade-in-up [animation-delay:100ms] opacity-0 space-y-6">
        <div className="stitch-section-card">
          <label htmlFor="plan-title" className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
            Title
          </label>
          <input
            id="plan-title"
            value={plan?.title ?? ""}
            onChange={(e) => setPlan((prev) => (prev ? { ...prev, title: e.target.value } : prev))}
            className="mt-1.5 h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-amber-300 focus:ring-2 focus:ring-amber-100"
          />
          <p className="mt-1.5 text-xs text-[var(--text-muted)]">
            {presetName ? `Based on preset: ${presetName} · ` : ""}
            {error ? <span className="text-red-600">{error}</span> : saving ? "Saving…" : lastSaved ? `Saved ${lastSaved.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : "Changes save automatically"}
          </p>
        </div>
        <ServicePlanRoleSlotsSection
          slots={roleSlotDrafts}
          roles={roles}
          members={members}
          onChange={(id, patch) =>
            setRoleSlotDrafts((prev) =>
              reindexPlanRoleSlots(
                prev.map((s) => (s.id === id ? { ...s, ...patch } : s)),
                roles
              )
            )
          }
          onAdjustRoleCount={(roleId, delta) =>
            setRoleSlotDrafts((prev) => adjustPlanRoleSlotCount(prev, roles, roleId, delta, createLocalId))
          }
          onRemoveSlot={(id) =>
            setRoleSlotDrafts((prev) => reindexPlanRoleSlots(prev.filter((s) => s.id !== id), roles))
          }
          awayIds={awayIds}
          headerAction={
            aiEnabled && roleSlotDrafts.length > 0 ? (
              <AiButton onClick={() => setAiOpen(true)}>Fill with AI</AiButton>
            ) : null
          }
        />
        {aiEnabled && plan && (
          <AiFillDialog
            open={aiOpen}
            onClose={() => setAiOpen(false)}
            planId={plan.id}
            planDate={plan.service_date}
            churchId={plan.church_id}
            slots={roleSlotDrafts}
            roleNameById={Object.fromEntries(roles.map((r) => [r.id, r.name]))}
            onApply={(picks) =>
              setRoleSlotDrafts((prev) =>
                prev.map((s) => {
                  const pick = picks.find((p) => p.slotId === s.id);
                  return pick && !s.assigned_user_id ? { ...s, assigned_user_id: pick.userId, status: "ASSIGNED" } : s;
                })
              )
            }
          />
        )}
        <ServicePlanStepsEditor
          items={items}
          members={members}
          savingState={error ? "error" : saving ? "saving" : lastSaved ? "saved" : "idle"}
          onItemsChange={setItems}
          onAddStep={() => handleAddItem("New step")}
          onAddQuickStep={(title) => handleAddItem(title)}
        />
      </PageGridFull>
    </PageGrid>
  );
}

function mapRoleSlotRows(rows: ServicePlanRoleSlot[]): PlanRoleSlotDraft[] {
  return (rows ?? []).map((r) => ({
    id: r.id,
    role_id: r.role_id,
    sort_order: r.sort_order,
    assigned_user_id: r.assigned_user_id,
    backup_user_id: r.backup_user_id,
    status: r.status,
    notes: r.notes ?? ""
  }));
}
