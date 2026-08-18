"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Settings2 } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import AdminHeader from "../../../../components/admin/AdminHeader";
import ServicePlanHeader from "../../../../components/servicePlans/ServicePlanHeader";
import ServicePlanEmptyState from "../../../../components/servicePlans/ServicePlanEmptyState";
import ServicePlanStepsEditor from "../../../../components/servicePlans/ServicePlanStepsEditor";
import ServicePlanRoleSlotsSection from "../../../../components/servicePlans/ServicePlanRoleSlotsSection";
import CopyLastPlanButton from "../../../../components/servicePlans/CopyLastPlanButton";
import GenerateFromPresetButton from "../../../../components/servicePlans/GenerateFromPresetButton";
import { PageGrid, PageGridFull, PageGridRowTwoOne } from "../../../../components/layout/PageGrid";
import RolesCard from "../../../../components/volunteers/RolesCard";
import { getCurrentContext } from "../../../../lib/supabaseData";
import { formatFriendlyLocalDate } from "../../../../lib/format";
import { useToast } from "../../../../lib/toast";
import {
  createPlanRow,
  fetchAllPlansForDate,
  fetchPlanByDate,
  fetchPlanItems,
  fetchPresetItems,
  fetchPresetsWithCounts,
  fetchPreviousPlan,
  fetchPlanRoleSlots,
  replacePlanItems,
  replacePlanRoleSlots,
  adjustPlanRoleSlotCount,
  reindexPlanRoleSlots,
  type PlanItemDraft,
  type PlanRoleSlotDraft,
  type ServicePlanRoleSlot,
  type PresetWithCount,
  type ServicePlan,
  type ServicePlanItem,
  type ServicePresetItem
} from "../../../../lib/db/servicePlans";
import type { ServiceEntry } from "../../../../components/servicePlans/ServicePlanHeader";
import { supabase } from "../../../../lib/supabaseClient";
import type { Database, ServicePlanStatus } from "@gather/lib";

type ServiceTime = Database["public"]["Tables"]["service_times"]["Row"];
type RoleRow = Database["public"]["Tables"]["volunteer_roles"]["Row"];

type PageState = "loading" | "ready" | "restricted";

const createLocalId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `local-${Math.random().toString(16).slice(2)}`;
};

export default function ServicePlansPage() {
  const [plansForDate, setPlansForDate] = useState<ServicePlan[]>([]);
  const [planStartTime, setPlanStartTime] = useState("");
  const [serviceDate, setServiceDate] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [presets, setPresets] = useState<PresetWithCount[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [plan, setPlan] = useState<ServicePlan | null>(null);
  const [planItems, setPlanItems] = useState<PlanItemDraft[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [planTitle, setPlanTitle] = useState("");
  const [churchId, setChurchId] = useState<string | null>(null);
  const [status, setStatus] = useState<PageState>("loading");
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingPresets, setLoadingPresets] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [focusItemId, setFocusItemId] = useState<string | null>(null);
  const [roleSlotDrafts, setRoleSlotDrafts] = useState<PlanRoleSlotDraft[]>([]);
  const [members, setMembers] = useState<{ id: string; full_name: string | null; email: string | null }[]>([]);
  // Role management
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleMinistry, setNewRoleMinistry] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editRoleName, setEditRoleName] = useState("");
  const [editRoleMinistry, setEditRoleMinistry] = useState("");
  const [editRoleDescription, setEditRoleDescription] = useState("");
  const [rolesOpen, setRolesOpen] = useState(false);
  const [presetOpen, setPresetOpen] = useState(false);
  const presetRef = useRef<HTMLDivElement>(null);
  const skipAutosaveRef = useRef(true);
  const saveTimerRef = useRef<number | null>(null);
  const router = useRouter();
  const { toast, pushToast } = useToast();

  const hasPresets = useMemo(() => presets.length > 0, [presets]);

  const planStatusLabel = useMemo(() => {
    if (!plan) return "NOT CREATED";
    if (planItems.length === 0) return "DRAFT";
    const allDone = planItems.every((item) => item.status === "DONE");
    return allDone ? "COMPLETED" : "READY";
  }, [plan, planItems]);

  const loadRoles = async (activeChurchId: string) => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("volunteer_roles")
      .select("*")
      .eq("church_id", activeChurchId)
      .order("name", { ascending: true });
    if (error) {
      pushToast(error.message, "error");
      return;
    }
    setRoles(data ?? []);
  };

  const handleAddRole = async () => {
    if (!supabase || !churchId) return;
    const trimmed = newRoleName.trim();
    if (!trimmed) return;
    const { error } = await supabase.from("volunteer_roles").insert({
      church_id: churchId,
      name: trimmed,
      description: newRoleDescription.trim() || null
    });
    if (error) { pushToast(error.message, "error"); return; }
    setNewRoleName("");
    setNewRoleMinistry("");
    setNewRoleDescription("");
    loadRoles(churchId);
  };

  const handleEditRole = (role: { id: string; name: string; ministryName?: string | null; description?: string | null }) => {
    setEditingRoleId(role.id);
    setEditRoleName(role.name);
    setEditRoleMinistry(role.ministryName ?? "");
    setEditRoleDescription(role.description ?? "");
  };

  const handleSaveRole = async () => {
    if (!supabase || !editingRoleId || !churchId) return;
    const trimmed = editRoleName.trim();
    if (!trimmed) return;
    const { error } = await supabase
      .from("volunteer_roles")
      .update({ name: trimmed, description: editRoleDescription.trim() || null })
      .eq("id", editingRoleId);
    if (error) { pushToast(error.message, "error"); return; }
    setEditingRoleId(null);
    setEditRoleName("");
    setEditRoleMinistry("");
    setEditRoleDescription("");
    loadRoles(churchId);
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!supabase || !churchId) return;
    const { error } = await supabase.from("volunteer_roles").delete().eq("id", roleId);
    if (error) { pushToast(error.message, "error"); return; }
    loadRoles(churchId);
  };

  const loadPresets = async (activeChurchId: string, _dateValue?: string) => {
    setLoadingPresets(true);
    try {
      const data: PresetWithCount[] = await fetchPresetsWithCounts(activeChurchId);
      setPresets(data ?? []);
      const defaultPreset = (data ?? []).find((preset: PresetWithCount) => preset.is_default);
      setSelectedPresetId(defaultPreset?.id ?? data?.[0]?.id ?? "");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Unable to load presets.", "error");
    } finally {
      setLoadingPresets(false);
    }
  };

  const loadPlanData = async (planData: ServicePlan | null) => {
    setPlan(planData ?? null);
    setPlanTitle(planData?.title ?? "Service Plan");
    setPlanStartTime((planData as any)?.start_time ?? "");
    if (planData?.preset_id) setSelectedPresetId(planData.preset_id);
    if (planData?.id) {
      const [items, slots] = await Promise.all([fetchPlanItems(planData.id), fetchPlanRoleSlots(planData.id)]);
      setPlanItems(mapPlanItems(items));
      setRoleSlotDrafts(mapRoleSlotRows(slots));
    } else {
      setPlanItems([]);
      setRoleSlotDrafts([]);
    }
  };

  const loadPlan = async (activeChurchId: string, dateValue: string, activePlanId?: string) => {
    setLoadingPlan(true);
    skipAutosaveRef.current = true;
    try {
      const allPlans = await fetchAllPlansForDate(activeChurchId, dateValue);
      setPlansForDate(allPlans);
      const targetPlan = activePlanId
        ? (allPlans.find((p) => p.id === activePlanId) ?? allPlans[0] ?? null)
        : (allPlans[0] ?? null);
      await loadPlanData(targetPlan);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Unable to load plan.", "error");
    } finally {
      setLoadingPlan(false);
      window.setTimeout(() => { skipAutosaveRef.current = false; }, 0);
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
      setChurchId(context.profile.church_id);
      await Promise.all([
        loadRoles(context.profile.church_id),
        loadPresets(context.profile.church_id, serviceDate),
        loadPlan(context.profile.church_id, serviceDate),
      ]);
      setStatus("ready");
    };

    load();
  }, [router]);

  useEffect(() => {
    if (!supabase || !churchId) {
      setMembers([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("church_id", churchId)
        .eq("disabled", false)
        .in("role", ["SERVICE", "ADMIN"])
        .order("full_name", { ascending: true });
      if (!cancelled && !error && data) {
        setMembers(data);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [churchId]);

  useEffect(() => {
    if (churchId && serviceDate) {
      loadPresets(churchId, serviceDate);
      loadPlan(churchId, serviceDate);
    }
  }, [churchId, serviceDate]);

  const persistPlan = useCallback(
    async (planId: string, options?: { notify?: boolean }) => {
      if (!supabase) return;
      setSaveState("saving");
      try {
        const { error: updateError } = await supabase
          .from("service_plans")
          .update({ title: planTitle.trim() || "Service Plan" })
          .eq("id", planId);
        if (updateError) {
          throw new Error(updateError.message);
        }
        await replacePlanItems(planId, planItems);
        await replacePlanRoleSlots(planId, roleSlotDrafts);
        setSaveState("saved");
        if (options?.notify) {
          pushToast("Service plan saved.", "success");
        }
        window.setTimeout(() => setSaveState("idle"), 1500);
      } catch {
        setSaveState("error");
        pushToast("Could not save changes. Try again.", "error");
      }
    },
    [planTitle, planItems, roleSlotDrafts, pushToast]
  );

  useEffect(() => {
    if (!plan || skipAutosaveRef.current) return;
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      void persistPlan(plan.id);
    }, 500);
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [plan, planTitle, planItems, roleSlotDrafts, persistPlan]);

  useEffect(() => {
    if (!focusItemId) return;
    const timer = window.setTimeout(() => setFocusItemId(null), 800);
    return () => window.clearTimeout(timer);
  }, [focusItemId]);

  const handleSavePlanNow = useCallback(async () => {
    if (!plan) return;
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    await persistPlan(plan.id, { notify: true });
  }, [plan, persistPlan]);

  const handleGenerateFromPreset = async () => {
    if (!churchId || !selectedPresetId) return;
    try {
      let activePlan = plan;
      if (!activePlan) {
        const preset = presets.find((item) => item.id === selectedPresetId);
        activePlan = await createPlanRow({
          churchId, serviceDate,
          presetId: selectedPresetId,
          title: preset?.name || "Service Plan",
          startTime: planStartTime || null,
        });
        if (!activePlan) return;
      } else {
        await supabase?.from("service_plans").update({ preset_id: selectedPresetId }).eq("id", activePlan.id);
      }
      const presetItems = await fetchPresetItems(selectedPresetId);
      const draftItems = presetItems.map((item: ServicePresetItem) => ({
        id: item.id, title: item.title, duration_minutes: item.duration_minutes,
        notes: item.notes ?? "", owner_role_id: item.owner_role_id,
        assigned_user_id: null as string | null, backup_user_id: null as string | null,
        status: "PLANNED" as ServicePlanStatus,
      }));
      await replacePlanItems(activePlan.id, draftItems);
      await loadPlan(churchId, serviceDate, activePlan.id);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Unable to generate plan.", "error");
    }
  };

  const handleCopyLastPlan = async () => {
    if (!churchId) return;
    try {
      const previousPlan = await fetchPreviousPlan(churchId, serviceDate);
      if (!previousPlan) { pushToast("No previous plan found.", "error"); return; }
      const previousItems = await fetchPlanItems(previousPlan.id);
      let activePlan = plan;
      if (!activePlan) {
        activePlan = await createPlanRow({
          churchId, serviceDate,
          presetId: previousPlan.preset_id,
          title: previousPlan.title || "Service Plan",
          startTime: planStartTime || null,
        });
        if (!activePlan) return;
      }
      const draftItems = mapPlanItems(previousItems);
      await replacePlanItems(activePlan.id, draftItems);
      const previousSlots: ServicePlanRoleSlot[] = await fetchPlanRoleSlots(previousPlan.id);
      await replacePlanRoleSlots(activePlan.id, previousSlots.map((s) => ({
        id: createLocalId(), role_id: s.role_id, sort_order: s.sort_order,
        assigned_user_id: s.assigned_user_id, backup_user_id: s.backup_user_id,
        status: s.status, notes: s.notes ?? "",
      })));
      await loadPlan(churchId, serviceDate, activePlan.id);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Unable to copy previous plan.", "error");
    }
  };

  const handleSwitchService = async (planId: string) => {
    if (!churchId || planId === plan?.id) return;
    if (plan) await persistPlan(plan.id);
    setLoadingPlan(true);
    skipAutosaveRef.current = true;
    try {
      const target = plansForDate.find((p) => p.id === planId) ?? null;
      await loadPlanData(target);
    } finally {
      setLoadingPlan(false);
      window.setTimeout(() => { skipAutosaveRef.current = false; }, 0);
    }
  };

  const handleAddSecondService = async (startTime: string) => {
    if (!churchId) return;
    try {
      const newPlan = await createPlanRow({ churchId, serviceDate, startTime, title: "Service Plan" });
      if (!newPlan) return;
      await loadPlan(churchId, serviceDate, newPlan.id);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Unable to add second service.", "error");
    }
  };

  const handleAddStep = (title = "New step") => {
    const id = createLocalId();
    setPlanItems((prev) => [
      ...prev,
      {
        id,
        title,
        duration_minutes: null,
        notes: "",
        owner_role_id: null,
        assigned_user_id: null,
        backup_user_id: null,
        status: "PLANNED"
      }
    ]);
    setFocusItemId(id);
  };

  const handlePrint = () => {
    if (!plan) return;
    window.open(`/admin/service-plans/print/${plan.id}`, "_blank", "noopener,noreferrer");
  };

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

  const selectedPreset = presets.find((p) => p.id === selectedPresetId);

  return (
    <PageGrid>
      {/* Page header */}
      <PageGridFull className="animate-fade-in-up">
        <AdminHeader
          title="Service Plans"
          subtitle="Run of show, roles, and team readiness in one place."
          actions={
            <Link
              href="/admin/service-presets"
              className="btn btn-secondary btn-sm"
            >
              Manage presets
            </Link>
          }
        />
      </PageGridFull>

      {/* Control bar */}
      <PageGridFull className="animate-fade-in-up [animation-delay:60ms]">
        <ServicePlanHeader
          serviceDate={serviceDate}
          startTime={planStartTime}
          statusLabel={loadingPlan ? "NOT CREATED" : planStatusLabel}
          servicesOnDate={plansForDate.map((p): ServiceEntry => ({ id: p.id, startTime: (p as any).start_time ?? null }))}
          activePlanId={plan?.id ?? null}
          onServiceDateChange={setServiceDate}
          onStartTimeChange={setPlanStartTime}
          onSwitchService={handleSwitchService}
          onAddSecondService={handleAddSecondService}
          actions={
            <>
              <Button
                variant="primaryGradient"
                size="sm"
                onClick={() => void handleSavePlanNow()}
                disabled={!plan}
                loading={saveState === "saving"}
              >
                {saveState === "saved" ? "Saved ✓" : "Save plan"}
              </Button>
              <Button size="sm" variant="secondary" onClick={handlePrint} disabled={!plan}>
                Print
              </Button>
            </>
          }
        />
      </PageGridFull>

      {/* Preset / copy toolbar */}
      <PageGridFull className="animate-fade-in-up [animation-delay:100ms]">
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-container-low)] px-5 py-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">Start from</span>
            <span className="text-[10px] text-[var(--text-muted)]">Presets are reusable run-of-show templates you apply to a specific date.</span>
          </div>

          {/* Preset custom dropdown — portal-rendered to escape stacking context */}
          <div ref={presetRef} className="relative">
            <button
              type="button"
              disabled={!hasPresets || loadingPresets}
              onClick={() => {
                setPresetOpen((o) => !o);
              }}
              className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-2)] disabled:opacity-50 focus:outline-none"
            >
              <span>{selectedPreset ? `${selectedPreset.name} (${selectedPreset.stepCount} steps)` : (loadingPresets ? "Loading…" : "No presets")}</span>
              <ChevronDown className={`h-3.5 w-3.5 text-[var(--text-muted)] transition-transform duration-150 ${presetOpen ? "rotate-180" : ""}`} />
            </button>
            {presetOpen && typeof document !== "undefined" && createPortal(
              <div
                className="fixed inset-0 z-[900]"
                onClick={() => setPresetOpen(false)}
              >
                <ul
                  className="absolute overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-lg"
                  style={(() => {
                    const rect = presetRef.current?.getBoundingClientRect();
                    return rect
                      ? { top: rect.bottom + 6, left: rect.left, minWidth: rect.width }
                      : {};
                  })()}
                  onClick={(e) => e.stopPropagation()}
                >
                  {presets.map((p) => (
                    <li key={p.id} className="list-none">
                      <button
                        type="button"
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--surface-2)] ${p.id === selectedPresetId ? "font-semibold text-amber-700 bg-amber-50" : "text-[var(--text-primary)]"}`}
                        onClick={() => { setSelectedPresetId(p.id); setPresetOpen(false); }}
                      >
                        <span>{p.name}</span>
                        <span className="ml-4 text-xs text-[var(--text-muted)]">{p.stepCount} steps</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>,
              document.body
            )}
          </div>

          <GenerateFromPresetButton
            disabled={!hasPresets || !selectedPresetId}
            hasPlan={!!plan}
            onGenerate={handleGenerateFromPreset}
          />

          <span className="text-xs text-[var(--text-muted)]">or</span>

          <CopyLastPlanButton onCopy={handleCopyLastPlan} disabled={loadingPlan} />
        </div>
      </PageGridFull>

      {/* Main content */}
      <PageGridFull className="animate-fade-in-up [animation-delay:140ms]">
        {!plan ? (
          <ServicePlanEmptyState
            friendlyDate={formatFriendlyLocalDate(serviceDate) || serviceDate}
            hasPresets={hasPresets}
            onGenerate={handleGenerateFromPreset}
            onCopyLast={handleCopyLastPlan}
            generateDisabled={!hasPresets || !selectedPresetId}
            copyDisabled={loadingPlan}
          />
        ) : (
          <div className="space-y-6">
            {/* Inline plan title */}
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={planTitle}
                onChange={(e) => setPlanTitle(e.target.value)}
                className="flex-1 bg-transparent text-2xl font-bold tracking-tight text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
                placeholder="Service Plan"
              />
              {saveState === "saving" && (
                <span className="text-xs text-[var(--text-muted)]">Saving…</span>
              )}
              {saveState === "saved" && (
                <span className="text-xs text-green-600">Saved</span>
              )}
            </div>

            <ServicePlanRoleSlotsSection
              slots={roleSlotDrafts}
              roles={roles}
              members={members}
              onChange={(id, patch) =>
                setRoleSlotDrafts((prev) =>
                  reindexPlanRoleSlots(prev.map((s) => (s.id === id ? { ...s, ...patch } : s)), roles)
                )
              }
              onAdjustRoleCount={(roleId, delta) =>
                setRoleSlotDrafts((prev) => adjustPlanRoleSlotCount(prev, roles, roleId, delta, createLocalId))
              }
              onRemoveSlot={(id) =>
                setRoleSlotDrafts((prev) => reindexPlanRoleSlots(prev.filter((s) => s.id !== id), roles))
              }
            />

            <ServicePlanStepsEditor
              items={planItems}
              members={members}
              savingState={saveState}
              focusItemId={focusItemId}
              onItemsChange={setPlanItems}
              onAddStep={() => handleAddStep("New step")}
              onAddQuickStep={handleAddStep}
            />
          </div>
        )}
      </PageGridFull>

      {/* Collapsible roles panel */}
      <PageGridFull className="animate-fade-in-up [animation-delay:180ms]">
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <button
            type="button"
            onClick={() => setRolesOpen((o) => !o)}
            className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[var(--surface-2)]"
          >
            <div className="flex items-center gap-3">
              <Settings2 className="h-5 w-5 text-[var(--text-muted)]" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Volunteer roles</p>
                <p className="text-xs text-[var(--text-muted)]">{roles.length} role{roles.length !== 1 ? "s" : ""} configured</p>
              </div>
            </div>
            <ChevronRight className={`h-4 w-4 text-[var(--text-muted)] transition-transform duration-200 ${rolesOpen ? "rotate-90" : ""}`} />
          </button>
          {rolesOpen && (
            <div className="border-t border-[var(--border)] p-5">
              <RolesCard
                roles={roles}
                newRoleName={newRoleName}
                newRoleMinistry={newRoleMinistry}
                newRoleDescription={newRoleDescription}
                editingRoleId={editingRoleId}
                editRoleName={editRoleName}
                editRoleMinistry={editRoleMinistry}
                editRoleDescription={editRoleDescription}
                onNewRoleNameChange={setNewRoleName}
                onNewRoleMinistryChange={setNewRoleMinistry}
                onNewRoleDescriptionChange={setNewRoleDescription}
                onAddRole={handleAddRole}
                onEditRole={handleEditRole}
                onEditRoleNameChange={setEditRoleName}
                onEditRoleMinistryChange={setEditRoleMinistry}
                onEditRoleDescriptionChange={setEditRoleDescription}
                onSaveRole={handleSaveRole}
                onCancelEdit={() => setEditingRoleId(null)}
                onDeleteRole={handleDeleteRole}
              />
            </div>
          )}
        </div>
      </PageGridFull>

      {toast && (
        <PageGridFull>
          <div className="fixed right-6 top-20 z-50 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm shadow-lg">
            <p className={toast.tone === "error" ? "text-red-600" : "text-green-700"}>{toast.message}</p>
          </div>
        </PageGridFull>
      )}
    </PageGrid>
  );
}

function mapPlanItems(items: ServicePlanItem[]): PlanItemDraft[] {
  return (items ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    duration_minutes: item.duration_minutes,
    notes: item.notes ?? "",
    owner_role_id: item.owner_role_id,
    assigned_user_id: item.assigned_user_id ?? null,
    backup_user_id: item.backup_user_id ?? null,
    status: (item.status ?? "PLANNED") as ServicePlanStatus
  }));
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
