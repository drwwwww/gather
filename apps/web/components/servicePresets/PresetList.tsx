"use client";

import { ListPlus } from "lucide-react";
import type { Database } from "@gather/lib";
import Link from "next/link";

// ...existing code...
import ServiceTimeSelector from "./ServiceTimeSelector";
import PresetCreateRow from "./PresetCreateRow";
import PresetCard from "./PresetCard";
import type { PresetItemDraft } from "./PresetStepsEditor";
import StarterTemplates from "./StarterTemplates";
import Loader from "../ui/Loader";
import type { PresetTemplate } from "../../lib/presets";

type ServiceTime = Database["public"]["Tables"]["service_times"]["Row"];
type ServicePreset = Database["public"]["Tables"]["service_presets"]["Row"];
type PresetItemRow = Database["public"]["Tables"]["service_preset_items"]["Row"];
type PresetWithItems = ServicePreset & { items: PresetItemRow[] };

type PresetListProps = {
  serviceTimes: ServiceTime[];
  selectedServiceTimeId: string;
  presets: PresetWithItems[];
  expandedPresetId: string | null;
  newPresetName: string;
  onServiceTimeChange: (value: string) => void;
  onNewPresetNameChange: (value: string) => void;
  onCreatePreset: () => void;
  onTemplateSelect: (template: PresetTemplate) => void;
  onTogglePreset: (presetId: string) => void;
  onSetDefault: (presetId: string) => void;
  onDuplicate: (preset: PresetWithItems) => void;
  onDelete: (preset: PresetWithItems) => void;
  onSavePreset: (presetId: string, name: string, items: PresetItemDraft[]) => void;
  loading?: boolean;
  savingPresetId?: string | null;
  error?: string | null;
};

export default function PresetList({
  serviceTimes,
  selectedServiceTimeId,
  presets,
  expandedPresetId,
  newPresetName,
  onServiceTimeChange,
  onNewPresetNameChange,
  onCreatePreset,
  onTemplateSelect,
  onTogglePreset,
  onSetDefault,
  onDuplicate,
  onDelete,
  onSavePreset,
  loading,
  savingPresetId,
  error
}: PresetListProps) {
  return (
    <div className="space-y-6">
      <div className="card shadow-sm p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-8">
          <div className="flex-1 min-w-[240px]">
            <ServiceTimeSelector
              serviceTimes={serviceTimes}
              selectedServiceTimeId={selectedServiceTimeId}
              onChange={onServiceTimeChange}
            />
          </div>
          <div className="flex-1 min-w-[320px]">
            <PresetCreateRow
              name={newPresetName}
              onNameChange={onNewPresetNameChange}
              onCreate={onCreatePreset}
              disabled={loading}
            />
          </div>
        </div>
        {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}
      </div>

      <div className="card shadow-sm p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="card-title">Presets</div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              The default preset is used when generating new service plans.
            </p>
          </div>
          <Link className="btn btn-sm btn-outline" href="/admin/service-plans">
            Generate next service plan
          </Link>
        </div>
        <div className="mt-4 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-6">
              <Loader />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading presets...</p>
            </div>
          ) : presets.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-8 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)]">
                <ListPlus className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>No presets found</p>
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Start with a template below or create a new preset.</p>
              </div>
              <div className="mt-3 w-full">
                <StarterTemplates onSelect={onTemplateSelect} />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {presets.map((preset) => (
                <PresetCard
                  key={preset.id}
                  preset={preset}
                  isExpanded={expandedPresetId === preset.id}
                  saving={savingPresetId === preset.id}
                  onToggle={() => onTogglePreset(preset.id)}
                  onSetDefault={onSetDefault}
                  onDuplicate={onDuplicate}
                  onDelete={onDelete}
                  onSave={onSavePreset}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
