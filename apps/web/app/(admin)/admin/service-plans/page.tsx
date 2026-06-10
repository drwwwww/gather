"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const [serviceTimes, setServiceTimes] = useState<ServiceTime[]>([]);
  const [serviceTimeId, setServiceTimeId] = useState("");
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

  const loadPresets = async (activeChurchId: string, timeId: string) => {
    setLoadingPresets(true);
    try {
      const data: PresetWithCount[] = await fetchPresetsWithCounts(activeChurchId, timeId);
      setPresets(data ?? []);
      const defaultPreset = (data ?? []).find((preset: PresetWithCount) => preset.is_default);
      setSelectedPresetId(defaultPreset?.id ?? data?.[0]?.id ?? "");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Unable to load presets.", "error");
    } finally {
      setLoadingPresets(false);
    }
  };

  const loadPlan = async (activeChurchId: string, timeId: string, dateValue: string) => {
    setLoadingPlan(true);
    skipAutosaveRef.current = true;
    try {
      const planData = await fetchPlanByDate(activeChurchId, timeId, dateValue);
      setPlan(planData ?? null);
      setPlanTitle(planData?.title ?? "Service Plan");
      if (planData?.preset_id) {
        setSelectedPresetId(planData.preset_id);
      }
      if (planData?.id) {
        const [items, slots] = await Promise.all([fetchPlanItems(planData.id), fetchPlanRoleSlots(planData.id)]);
        setPlanItems(mapPlanItems(items));
        setRoleSlotDrafts(mapRoleSlotRows(slots));
      } else {
        setPlanItems([]);
        setRoleSlotDrafts([]);
      }
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Unable to load plan.", "error");
    } finally {
      setLoadingPlan(false);
      window.setTimeout(() => {
        skipAutosaveRef.current = false;
      }, 0);
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
      setServiceTimes(context.serviceTimes);
      setChurchId(context.profile.church_id);
      const firstTimeId = context.serviceTimes[0]?.id ?? "";
      setServiceTimeId(firstTimeId);
      if (firstTimeId) {
        await Promise.all([
          loadRoles(context.profile.church_id),
          loadPresets(context.profile.church_id, firstTimeId),
          loadPlan(context.profile.church_id, firstTimeId, serviceDate)
        ]);
      }
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
    if (churchId && serviceTimeId) {
      loadPresets(churchId, serviceTimeId);
      loadPlan(churchId, serviceTimeId, serviceDate);
    }
  }, [churchId, serviceTimeId, serviceDate]);

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
    if (!churchId || !serviceTimeId || !selectedPresetId) return;
    try {
      let activePlan = plan;
      if (!activePlan) {
        const preset = presets.find((item) => item.id === selectedPresetId);
        const title = preset?.name || "Service Plan";
        activePlan = await createPlanRow({
          churchId,
          serviceTimeId,
          serviceDate,
          presetId: selectedPresetId,
          title
        });
        if (!activePlan) return;
      } else {
        await supabase
          ?.from("service_plans")
          .update({ preset_id: selectedPresetId })
          .eq("id", activePlan.id);
      }

      const presetItems = await fetchPresetItems(selectedPresetId);
      const draftItems = presetItems.map((item: ServicePresetItem) => ({
        id: item.id,
        title: item.title,
        duration_minutes: item.duration_minutes,
        notes: item.notes ?? "",
        owner_role_id: item.owner_role_id,
        assigned_user_id: null as string | null,
        backup_user_id: null as string | null,
        status: "PLANNED" as ServicePlanStatus
      }));

      await replacePlanItems(activePlan.id, draftItems);
      await loadPlan(churchId, serviceTimeId, serviceDate);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Unable to generate plan.", "error");
    }
  };

  const handleCopyLastPlan = async () => {
    if (!churchId || !serviceTimeId) return;
    try {
      const previousPlan = await fetchPreviousPlan(churchId, serviceTimeId, serviceDate);
      if (!previousPlan) {
        pushToast("No previous plan found for this service time.", "error");
        return;
      }

      const previousItems = await fetchPlanItems(previousPlan.id);
      let activePlan = plan;
      if (!activePlan) {
        activePlan = await createPlanRow({
          churchId,
          serviceTimeId,
          serviceDate,
          presetId: previousPlan.preset_id,
          title: previousPlan.title || "Service Plan"
        });
        if (!activePlan) return;
      }

      const draftItems = mapPlanItems(previousItems);
      await replacePlanItems(activePlan.id, draftItems);
      const previousSlots: ServicePlanRoleSlot[] = await fetchPlanRoleSlots(previousPlan.id);
      const slotDrafts: PlanRoleSlotDraft[] = previousSlots.map((s) => ({
        id: createLocalId(),
        role_id: s.role_id,
        sort_order: s.sort_order,
        assigned_user_id: s.assigned_user_id,
        backup_user_id: s.backup_user_id,
        status: s.status,
        notes: s.notes ?? ""
      }));
      await replacePlanRoleSlots(activePlan.id, slotDrafts);
      await loadPlan(churchId, serviceTimeId, serviceDate);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Unable to copy previous plan.", "error");
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

  return (
    <PageGrid>
      <PageGridFull className="animate-fade-in-up">
        <AdminHeader
          title="Service Plans"
          subtitle="See the run of show and keep the team aligned for each service."
          actions={
            <Link href="/admin/service-presets" className="inline-flex items-center justify-center h-[34px] px-3 rounded-xl font-medium text-sm bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2">
              Manage presets
            </Link>
          }
        />
      </PageGridFull>

      <PageGridRowTwoOne
        className="animate-fade-in-up [animation-delay:100ms] opacity-0"
        main={<div className="space-y-6">
        <ServicePlanHeader
          serviceTimes={serviceTimes}
          serviceTimeId={serviceTimeId}
          serviceDate={serviceDate}
          statusLabel={loadingPlan ? "NOT CREATED" : planStatusLabel}
          onServiceTimeChange={setServiceTimeId}
          onServiceDateChange={setServiceDate}
          actions={
            <>
              <Button
                variant="primaryGradient"
                size="sm"
                onClick={() => void handleSavePlanNow()}
                disabled={!plan}
                loading={saveState === "saving"}
              >
                Save plan
              </Button>
              <Button size="sm" variant="secondary" onClick={handlePrint} disabled={!plan}>
                Print plan
              </Button>
            </>
          }
        />

        <div className="card shadow-sm p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-base-content">Generate from preset</p>
              <p className="text-xs text-base-content/60">Presets keep your flow consistent.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="select select-bordered"
                value={selectedPresetId}
                onChange={(event) => setSelectedPresetId(event.target.value)}
                disabled={!hasPresets || loadingPresets}
              >
                {presets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name} ({preset.stepCount} steps)
                  </option>
                ))}
              </select>
              <GenerateFromPresetButton
                disabled={!hasPresets || !selectedPresetId}
                hasPlan={!!plan}
                onGenerate={handleGenerateFromPreset}
              />
              <CopyLastPlanButton onCopy={handleCopyLastPlan} disabled={loadingPlan || !serviceTimeId} />
            </div>
          </div>
        </div>

        {!plan ? (
          <ServicePlanEmptyState
            friendlyDate={formatFriendlyLocalDate(serviceDate) || serviceDate}
            onGenerate={handleGenerateFromPreset}
            onCopyLast={handleCopyLastPlan}
            generateDisabled={!hasPresets || !selectedPresetId}
            copyDisabled={loadingPlan}
          />
        ) : (
          <>
            <div className="card shadow-sm p-4">
              <label className="text-xs uppercase tracking-[0.2em] text-base-content/60">Plan title</label>
              <input
                type="text"
                value={planTitle}
                onChange={(event) => setPlanTitle(event.target.value)}
                className="input input-bordered w-full max-w-xl mt-2"
                placeholder="e.g. Sunday 9:00 — Easter"
              />
              <p className="text-xs text-base-content/50 mt-2">
                Changes auto-save after you pause typing. Use <span className="font-medium">Save plan</span> in the header to save immediately.
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
                setRoleSlotDrafts((prev) => reindexPlanRoleSlots(
                  prev.filter((s) => s.id !== id),
                  roles
                ))
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
          </>
        )}
      </div>}
        side={
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
        }
      />

      {toast ? (
        <PageGridFull>
          <div className="fixed right-6 top-6 z-50 rounded-xl bg-[var(--surface-2)] px-4 py-3 text-sm shadow">
            <p className={toast.tone === "error" ? "text-error" : "text-base-content"}>{toast.message}</p>
          </div>
        </PageGridFull>
      ) : null}
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
