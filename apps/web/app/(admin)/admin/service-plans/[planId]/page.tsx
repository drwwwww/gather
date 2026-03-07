"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminHeader from "../../../../../components/admin/AdminHeader";
import PageLoader from "../../../../../components/ui/PageLoader";
import PlanEditor from "../../../../../components/servicePlans/PlanEditor";
import { getCurrentContext } from "../../../../../lib/supabaseData";
import { supabase } from "../../../../../lib/supabaseClient";
import type { Database, ServicePlanStatus } from "@gather/lib";

type ServicePlan = Database["public"]["Tables"]["service_plans"]["Row"];
type PlanItemRow = Database["public"]["Tables"]["service_plan_items"]["Row"];
type RoleRow = Database["public"]["Tables"]["volunteer_roles"]["Row"];
type PresetRow = Database["public"]["Tables"]["service_presets"]["Row"];

type PlanItem = {
  id: string;
  title: string;
  duration_minutes: number | null;
  notes: string;
  owner_role_id: string | null;
  status: ServicePlanStatus;
};

type PageState = "loading" | "ready" | "restricted";

const createLocalId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `local-${Math.random().toString(16).slice(2)}`;
};

export default function ServicePlanEditorPage() {
  const params = useParams<{ planId: string }>();
  const planId = params?.planId;
  const [plan, setPlan] = useState<ServicePlan | null>(null);
  const [items, setItems] = useState<PlanItem[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [presetName, setPresetName] = useState<string | null>(null);
  const [status, setStatus] = useState<PageState>("loading");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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

    setPlan(planData);
    setRoles(roleData ?? []);
    setItems(
      (itemData ?? []).map((item: PlanItemRow) => ({
        id: item.id,
        title: item.title,
        duration_minutes: item.duration_minutes,
        notes: item.notes ?? "",
        owner_role_id: item.owner_role_id,
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
    };

    load();
  }, [router, planId]);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: createLocalId(),
        title: "",
        duration_minutes: null,
        notes: "",
        owner_role_id: null,
        status: "PLANNED"
      }
    ]);
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSave = async () => {
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

    const { error: deleteError } = await supabase
      .from("service_plan_items")
      .delete()
      .eq("plan_id", planId);

    if (deleteError) {
      setError(deleteError.message);
      setSaving(false);
      return;
    }

    if (items.length) {
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
        setError(insertError.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
  };

  if (status === "loading") {
    return <PageLoader message="Loading plan..." />;
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
        title={title}
        subtitle="Adjust this service plan without changing the preset."
      />
      <PlanEditor
        planTitle={plan?.title ?? ""}
        basedOnPresetName={presetName}
        items={items}
        roles={roles}
        onTitleChange={(value) => setPlan((prev) => (prev ? { ...prev, title: value } : prev))}
        onItemsChange={setItems}
        onAddItem={handleAddItem}
        onDeleteItem={handleDeleteItem}
        onSave={handleSave}
        saving={saving}
        error={error}
      />
    </>
  );
}
