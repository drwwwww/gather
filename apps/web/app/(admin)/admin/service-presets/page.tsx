"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "../../../../components/admin/AdminHeader";
import PageLoader from "../../../../components/ui/PageLoader";
import PresetList from "../../../../components/servicePresets/PresetList";
import { getCurrentContext } from "../../../../lib/supabaseData";
import { supabase } from "../../../../lib/supabaseClient";
import type { PresetTemplate } from "../../../../lib/presets";
import type { PresetItemDraft } from "../../../../components/servicePresets/PresetStepsEditor";
import type { Database } from "@gather/lib";

type ServicePreset = Database["public"]["Tables"]["service_presets"]["Row"];
type ServiceTime = Database["public"]["Tables"]["service_times"]["Row"];
type PresetItemRow = Database["public"]["Tables"]["service_preset_items"]["Row"];
type RoleRow = Database["public"]["Tables"]["volunteer_roles"]["Row"];

type PresetWithItems = ServicePreset & { items: PresetItemRow[] };

type PageState = "loading" | "ready" | "restricted";

export default function ServicePresetsPage() {
  const [serviceTimes, setServiceTimes] = useState<ServiceTime[]>([]);
  const [serviceTimeId, setServiceTimeId] = useState("");
  const [presets, setPresets] = useState<PresetWithItems[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [churchId, setChurchId] = useState<string | null>(null);
  const [newPresetName, setNewPresetName] = useState("");
  const [expandedPresetId, setExpandedPresetId] = useState<string | null>(null);
  const [status, setStatus] = useState<PageState>("loading");
  const [loadingPresets, setLoadingPresets] = useState(false);
  const [savingPresetId, setSavingPresetId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const canCreate = useMemo(() => newPresetName.trim().length > 0, [newPresetName]);

  const loadPresets = async (activeChurchId: string, timeId: string) => {
    if (!supabase) return;
    setLoadingPresets(true);
    const { data, error: presetError } = await supabase
      .from("service_presets")
      .select("*")
      .eq("church_id", activeChurchId)
      .eq("service_time_id", timeId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    if (presetError) {
      setError(presetError.message);
      setLoadingPresets(false);
      return;
    }
    const presetRows = data ?? [];
    const presetIds = presetRows.map((preset: ServicePreset) => preset.id);
    let itemRows: PresetItemRow[] = [];
    if (presetIds.length) {
      const { data: itemData, error: itemError } = await supabase
        .from("service_preset_items")
        .select("*")
        .in("preset_id", presetIds)
        .order("position", { ascending: true });
      if (itemError) {
        setError(itemError.message);
      } else {
        itemRows = itemData ?? [];
      }
    }

    const itemsByPreset = itemRows.reduce((acc, item) => {
      const list = acc[item.preset_id] ?? [];
      list.push(item);
      acc[item.preset_id] = list;
      return acc;
    }, {} as Record<string, PresetItemRow[]>);

    setPresets(
      presetRows.map((preset: ServicePreset) => ({
        ...preset,
        items: itemsByPreset[preset.id] ?? []
      }))
    );
    setLoadingPresets(false);
  };

  const loadRoles = async (activeChurchId: string) => {
    if (!supabase) return;
    const { data, error: rolesError } = await supabase
      .from("volunteer_roles")
      .select("*")
      .eq("church_id", activeChurchId)
      .order("name", { ascending: true });
    if (rolesError) {
      setError(rolesError.message);
      return;
    }
    setRoles(data ?? []);
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
        await loadRoles(context.profile.church_id);
        await loadPresets(context.profile.church_id, firstTimeId);
      }
      setStatus("ready");
    };

    load();
  }, [router]);

  useEffect(() => {
    if (churchId && serviceTimeId) {
      loadPresets(churchId, serviceTimeId);
    }
  }, [churchId, serviceTimeId]);

  useEffect(() => {
    setExpandedPresetId(null);
  }, [serviceTimeId]);

  const handleCreatePreset = async () => {
    if (!supabase || !churchId || !serviceTimeId || !canCreate) return;
    setError(null);
    const trimmed = newPresetName.trim();
    const { data, error: insertError } = await supabase
      .from("service_presets")
      .insert({ church_id: churchId, service_time_id: serviceTimeId, name: trimmed })
      .select("*")
      .single();

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setNewPresetName("");
    if (data?.id) {
      setExpandedPresetId(data.id);
    }
    await loadPresets(churchId, serviceTimeId);
  };

  const handleSetDefault = async (presetId: string) => {
    if (!supabase || !churchId || !serviceTimeId) return;
    setError(null);
    const { error: resetError } = await supabase
      .from("service_presets")
      .update({ is_default: false })
      .eq("church_id", churchId)
      .eq("service_time_id", serviceTimeId);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    const { error: updateError } = await supabase
      .from("service_presets")
      .update({ is_default: true })
      .eq("id", presetId);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await loadPresets(churchId, serviceTimeId);
  };

  const handleDuplicate = async (preset: PresetWithItems) => {
    if (!supabase || !churchId || !serviceTimeId) return;
    setError(null);
    const { data, error: insertError } = await supabase
      .from("service_presets")
      .insert({
        church_id: churchId,
        service_time_id: serviceTimeId,
        name: `${preset.name} (copy)`
      })
      .select("*")
      .single();

    if (insertError || !data) {
      setError(insertError?.message ?? "Unable to duplicate preset.");
      return;
    }

    if (preset.items.length) {
      const payload = preset.items.map((item, index) => ({
        preset_id: data.id,
        position: index + 1,
        title: item.title,
        duration_minutes: item.duration_minutes,
        notes: item.notes ?? "",
        owner_role_id: item.owner_role_id
      }));
      const { error: itemError } = await supabase
        .from("service_preset_items")
        .insert(payload);
      if (itemError) {
        setError(itemError.message);
        return;
      }
    }

    setExpandedPresetId(data.id);
    await loadPresets(churchId, serviceTimeId);
  };

  const handleDelete = async (preset: PresetWithItems) => {
    if (!supabase || !churchId || !serviceTimeId) return;
    setError(null);
    const { error: itemError } = await supabase
      .from("service_preset_items")
      .delete()
      .eq("preset_id", preset.id);
    if (itemError) {
      setError(itemError.message);
      return;
    }
    const { error: deleteError } = await supabase
      .from("service_presets")
      .delete()
      .eq("id", preset.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    if (expandedPresetId === preset.id) {
      setExpandedPresetId(null);
    }
    await loadPresets(churchId, serviceTimeId);
  };

  const handleSavePreset = async (presetId: string, name: string, items: PresetItemDraft[]) => {
    if (!supabase || !churchId || !serviceTimeId) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Preset name is required.");
      return;
    }
    setSavingPresetId(presetId);
    setError(null);
    const { error: updateError } = await supabase
      .from("service_presets")
      .update({ name: trimmedName })
      .eq("id", presetId);
    if (updateError) {
      setError(updateError.message);
      setSavingPresetId(null);
      return;
    }

    const { error: deleteError } = await supabase
      .from("service_preset_items")
      .delete()
      .eq("preset_id", presetId);
    if (deleteError) {
      setError(deleteError.message);
      setSavingPresetId(null);
      return;
    }

    if (items.length) {
      const payload = items.map((item, index) => ({
        preset_id: presetId,
        position: index + 1,
        title: item.title.trim() || "Untitled",
        duration_minutes: item.duration_minutes ?? null,
        notes: item.notes ?? "",
        owner_role_id: item.owner_role_id
      }));
      const { error: insertError } = await supabase
        .from("service_preset_items")
        .insert(payload);
      if (insertError) {
        setError(insertError.message);
        setSavingPresetId(null);
        return;
      }
    }

    setSavingPresetId(null);
    await loadPresets(churchId, serviceTimeId);
  };

  const handleTemplateSelect = async (template: PresetTemplate) => {
    if (!supabase || !churchId || !serviceTimeId) return;
    setError(null);
    const { data, error: insertError } = await supabase
      .from("service_presets")
      .insert({
        church_id: churchId,
        service_time_id: serviceTimeId,
        name: template.name
      })
      .select("*")
      .single();
    if (insertError || !data) {
      setError(insertError?.message ?? "Unable to create preset.");
      return;
    }

    if (template.steps.length) {
      const roleMap = new Map(
        roles.map((role) => [role.name.toLowerCase(), role.id])
      );
      const payload = template.steps.map((step, index) => ({
        preset_id: data.id,
        position: index + 1,
        title: step.title,
        duration_minutes: step.durationMinutes ?? null,
        notes: step.notes ?? "",
        owner_role_id: step.ownerRole ? roleMap.get(step.ownerRole.toLowerCase()) ?? null : null
      }));
      const { error: itemError } = await supabase
        .from("service_preset_items")
        .insert(payload);
      if (itemError) {
        setError(itemError.message);
        return;
      }
    }

    setExpandedPresetId(data.id);
    await loadPresets(churchId, serviceTimeId);
  };

  const handleTogglePreset = (presetId: string) => {
    setExpandedPresetId((prev) => (prev === presetId ? null : presetId));
  };

  if (status === "loading") {
    return <PageLoader message="Loading presets..." />;
  }

  if (status === "restricted") {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-4 px-6">
        <h1 className="text-2xl font-semibold">Access restricted</h1>
        <p className="text-sm text-base-content/70">Only admins can manage service presets.</p>
      </main>
    );
  }

  return (
    <>
      <AdminHeader
        title="Service Presets"
        subtitle="Create reusable run-of-show templates by service time."
      />
      <PresetList
        serviceTimes={serviceTimes}
        selectedServiceTimeId={serviceTimeId}
        presets={presets}
        roles={roles}
        expandedPresetId={expandedPresetId}
        newPresetName={newPresetName}
        onServiceTimeChange={setServiceTimeId}
        onNewPresetNameChange={setNewPresetName}
        onCreatePreset={handleCreatePreset}
        onTemplateSelect={handleTemplateSelect}
        onTogglePreset={handleTogglePreset}
        onSetDefault={handleSetDefault}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onSavePreset={handleSavePreset}
        loading={loadingPresets}
        savingPresetId={savingPresetId}
        error={error}
      />
    </>
  );
}
