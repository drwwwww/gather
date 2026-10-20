"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import PageLoader from "../../../../../components/ui/PageLoader";
import ServiceBoard from "../../../../../components/serviceBoard/ServiceBoard";
import { PageGrid, PageGridFull } from "../../../../../components/layout/PageGrid";
import { getCurrentContext } from "../../../../../lib/supabaseData";
import { useChurchPlan } from "../../../../../lib/plan";
import AiFillDialog from "../../../../../components/ai/AiFillDialog";
import { supabase } from "../../../../../lib/supabaseClient";
import {
  fetchPlanRoleSlots,
  replacePlanItems,
  replacePlanRoleSlots,
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
  const [serviceName, setServiceName] = useState<string | null>(null);

  // Volunteers → "Fill with AI" lands here with ?ai=1.
  useEffect(() => {
    if (aiEnabled && status === "ready" && new URLSearchParams(window.location.search).get("ai") === "1") {
      setAiOpen(true);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [aiEnabled, status]);

  const [serviceTimesForName, setServiceTimesForName] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    setServiceName(serviceTimesForName.find((t) => t.id === plan?.service_time_id)?.name ?? null);
  }, [serviceTimesForName, plan?.service_time_id]);

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
      setServiceTimesForName(context.serviceTimes.map((t) => ({ id: t.id, name: t.name })));
      setStatus("ready");
      hasLoadedRef.current = true;
    };

    load();
  }, [router, planId]);



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
        {/* The board's bar carries the (editable) title; this keeps the way back and a real page heading. */}
        <h1 className="sr-only">{title}</h1>
        <Link
          href="/admin/service-plans"
          className="inline-flex items-center gap-0.5 text-xs font-medium text-[var(--text-muted)] no-underline transition-colors hover:text-[var(--text-primary)]"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
          Service plans
        </Link>
      </PageGridFull>
      <PageGridFull className="animate-fade-in-up [animation-delay:100ms] opacity-0">
        {plan ? (
          <ServiceBoard
            title={plan.title ?? ""}
            onTitleChange={(value) => setPlan((prev) => (prev ? { ...prev, title: value } : prev))}
            planId={plan.id}
            planDate={plan.service_date}
            startTime={plan.start_time}
            serviceName={serviceName}
            churchId={plan.church_id}
            roles={roles}
            slots={roleSlotDrafts}
            onSlotsChange={(next) => setRoleSlotDrafts(reindexPlanRoleSlots(next, roles))}
            items={items}
            onItemsChange={setItems}
            savingLabel={error ? `Couldn't save: ${error}` : saving ? "Saving…" : lastSaved ? `Saved ${lastSaved.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : presetName ? `From ${presetName} · saves automatically` : "Saves automatically"}
            aiEnabled={aiEnabled}
            onOpenAi={() => setAiOpen(true)}
          />
        ) : null}
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
