"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminHeader from "../../../../../components/admin/AdminHeader";
import PresetEditor from "../../../../../components/servicePresets/PresetEditor";
import { getCurrentContext } from "../../../../../lib/supabaseData";
import { supabase } from "../../../../../lib/supabaseClient";
import type { Database } from "@gather/lib";

type ServicePreset = Database["public"]["Tables"]["service_presets"]["Row"];
type ServiceTime = Database["public"]["Tables"]["service_times"]["Row"];
type RoleRow = Database["public"]["Tables"]["volunteer_roles"]["Row"];
type PresetItemRow = Database["public"]["Tables"]["service_preset_items"]["Row"];

type PresetItem = {
  id: string;
  title: string;
  duration_minutes: number | null;
  notes: string;
  owner_role_id: string | null;
};

type PageState = "loading" | "ready" | "restricted";

const createLocalId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `local-${Math.random().toString(16).slice(2)}`;
};

export default function ServicePresetEditorPage() {
  const params = useParams<{ presetId: string }>();
  const presetId = params?.presetId;
  const [preset, setPreset] = useState<ServicePreset | null>(null);
  const [serviceTimes, setServiceTimes] = useState<ServiceTime[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [items, setItems] = useState<PresetItem[]>([]);
  const [status, setStatus] = useState<PageState>("loading");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const title = useMemo(() => preset?.name ?? "Service Preset", [preset]);

  const loadPreset = async (churchId: string) => {
    if (!supabase || !presetId) return;
    const [{ data: presetData, error: presetError }, { data: itemData, error: itemError }, { data: roleData }] = await Promise.all([
      supabase.from("service_presets").select("*").eq("id", presetId).single(),
      supabase.from("service_preset_items").select("*").eq("preset_id", presetId).order("position"),
      supabase.from("volunteer_roles").select("*").eq("church_id", churchId).order("name")
    ]);

    if (presetError || !presetData) {
      setError(presetError?.message ?? "Preset not found.");
      return;
    }

    if (itemError) {
      setError(itemError.message);
      return;
    }

    if (presetData.church_id !== churchId) {
      setError("Preset not found.");
      return;
    }

    setPreset(presetData);
    setRoles(roleData ?? []);
    setItems(
      (itemData ?? []).map((item: PresetItemRow) => ({
        id: item.id,
        title: item.title,
        duration_minutes: item.duration_minutes,
        notes: item.notes ?? "",
        owner_role_id: item.owner_role_id
      }))
    );
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
      await loadPreset(context.profile.church_id);
      setStatus("ready");
    };

    load();
  }, [router, presetId]);

  const handlePresetChange = (patch: Partial<ServicePreset>) => {
    if (!preset) return;
    setPreset({ ...preset, ...patch });
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { id: createLocalId(), title: "", duration_minutes: null, notes: "", owner_role_id: null }
    ]);
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSave = async () => {
    if (!supabase || !preset || !presetId) return;
    if (!preset.name.trim() || !preset.service_time_id) {
      setError("Preset name and service time are required.");
      return;
    }
    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("service_presets")
      .update({ name: preset.name.trim(), service_time_id: preset.service_time_id })
      .eq("id", presetId);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    const { error: deleteError } = await supabase
      .from("service_preset_items")
      .delete()
      .eq("preset_id", presetId);

    if (deleteError) {
      setError(deleteError.message);
      setSaving(false);
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
        setSaving(false);
        return;
      }
    }

    setSaving(false);
  };

  const handleSetDefault = async () => {
    if (!supabase || !preset) return;
    setError(null);
    const { error: resetError } = await supabase
      .from("service_presets")
      .update({ is_default: false })
      .eq("church_id", preset.church_id)
      .eq("service_time_id", preset.service_time_id);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    const { error: updateError } = await supabase
      .from("service_presets")
      .update({ is_default: true })
      .eq("id", preset.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setPreset({ ...preset, is_default: true });
  };

  if (status === "loading") {
    return <p className="text-sm text-base-content/70">Loading preset...</p>;
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
        title={title}
        subtitle="Define the ordered steps for this run of show."
      />
      <PresetEditor
        preset={preset}
        serviceTimes={serviceTimes}
        roles={roles}
        items={items}
        onPresetChange={handlePresetChange}
        onItemsChange={setItems}
        onAddItem={handleAddItem}
        onDeleteItem={handleDeleteItem}
        onSave={handleSave}
        onSetDefault={preset?.is_default ? undefined : handleSetDefault}
        saving={saving}
        error={error}
      />
    </>
  );
}
