"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminHeader from "../../../../components/admin/AdminHeader";
import ServicePlanHeader from "../../../../components/servicePlans/ServicePlanHeader";
import ServicePlanEmptyState from "../../../../components/servicePlans/ServicePlanEmptyState";
import ServicePlanStepsEditor from "../../../../components/servicePlans/ServicePlanStepsEditor";
import CopyLastPlanButton from "../../../../components/servicePlans/CopyLastPlanButton";
import GenerateFromPresetButton from "../../../../components/servicePlans/GenerateFromPresetButton";
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
  replacePlanItems,
  type PlanItemDraft,
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
  const [serviceDate, setServiceDate] = useState(() => new Date().toISOString().slice(0, 10));
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
        const items = await fetchPlanItems(planData.id);
        setPlanItems(mapPlanItems(items));
      } else {
        setPlanItems([]);
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
    if (churchId && serviceTimeId) {
      loadPresets(churchId, serviceTimeId);
      loadPlan(churchId, serviceTimeId, serviceDate);
    }
  }, [churchId, serviceTimeId, serviceDate]);

  useEffect(() => {
    if (!plan || skipAutosaveRef.current) return;
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      handleAutosave(plan.id);
    }, 500);
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [plan, planTitle, planItems]);

  useEffect(() => {
    if (!focusItemId) return;
    const timer = window.setTimeout(() => setFocusItemId(null), 800);
    return () => window.clearTimeout(timer);
  }, [focusItemId]);

  const handleAutosave = async (planId: string) => {
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
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 1500);
    } catch (err) {
      setSaveState("error");
      pushToast("Could not save changes. Try again.", "error");
    }
  };

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
    return <p className="text-sm text-base-content/70">Loading service plans...</p>;
  }

  if (status === "restricted") {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-4 px-6">
        <h1 className="text-2xl font-semibold">Access restricted</h1>
        <p className="text-sm text-base-content/70">Only admins can manage service plans.</p>
      </main>
    );
  }

  return (
    <>
      <AdminHeader
        title="Service Plans"
        subtitle="See the run of show and keep the team aligned for each service."
        actions={
          <Link className="btn btn-outline btn-sm" href="/admin/service-presets">
            Manage presets
          </Link>
        }
      />

      <div className="space-y-6">
        <ServicePlanHeader
          serviceTimes={serviceTimes}
          serviceTimeId={serviceTimeId}
          serviceDate={serviceDate}
          statusLabel={loadingPlan ? "NOT CREATED" : planStatusLabel}
          onServiceTimeChange={setServiceTimeId}
          onServiceDateChange={setServiceDate}
          actions={
            <>
              <button className="btn btn-outline btn-sm" onClick={handlePrint} disabled={!plan}>
                Print plan
              </button>
            </>
          }
        />

        <div className="card bg-base-100 shadow-md p-4 rounded-xl">
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
          <ServicePlanStepsEditor
            items={planItems}
            roles={roles}
            savingState={saveState}
            focusItemId={focusItemId}
            onItemsChange={setPlanItems}
            onAddStep={() => handleAddStep("New step")}
            onAddQuickStep={handleAddStep}
          />
        )}
      </div>

      {toast ? (
        <div className="fixed right-6 top-6 z-50 rounded-xl bg-base-200 px-4 py-3 text-sm shadow">
          <p className={toast.tone === "error" ? "text-error" : "text-base-content"}>{toast.message}</p>
        </div>
      ) : null}
    </>
  );
}

function mapPlanItems(items: ServicePlanItem[]): PlanItemDraft[] {
  return (items ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    duration_minutes: item.duration_minutes,
    notes: item.notes ?? "",
    owner_role_id: item.owner_role_id,
    status: (item.status ?? "PLANNED") as ServicePlanStatus
  }));
}
