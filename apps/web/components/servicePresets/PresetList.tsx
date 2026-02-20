"use client";

import type { Database } from "@gather/lib";
import Link from "next/link";
import { Card, CardTitle } from "../ui/card";
import { Accordion } from "../ui/accordion";
import ServiceTimeSelector from "./ServiceTimeSelector";
import PresetCreateRow from "./PresetCreateRow";
import PresetCard from "./PresetCard";
import type { PresetItemDraft } from "./PresetStepsEditor";
import StarterTemplates from "./StarterTemplates";
import type { PresetTemplate } from "../../lib/presets";

type ServiceTime = Database["public"]["Tables"]["service_times"]["Row"];
type ServicePreset = Database["public"]["Tables"]["service_presets"]["Row"];
type PresetItemRow = Database["public"]["Tables"]["service_preset_items"]["Row"];
type RoleRow = Database["public"]["Tables"]["volunteer_roles"]["Row"];

type PresetWithItems = ServicePreset & { items: PresetItemRow[] };

type PresetListProps = {
  serviceTimes: ServiceTime[];
  selectedServiceTimeId: string;
  presets: PresetWithItems[];
  roles: RoleRow[];
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
  roles,
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
      <Card>
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
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Presets</CardTitle>
            <p className="text-xs text-[var(--gather-muted)] mt-1">
              The default preset is used when generating new service plans.
            </p>
          </div>
          <Link className="btn btn-sm btn-outline" href="/admin/service-plans">
            Generate next service plan
          </Link>
        </div>
        <div className="mt-4 space-y-4">
          {loading ? (
            <p className="text-sm text-[var(--gather-muted)]">Loading presets...</p>
          ) : presets.length === 0 ? (
            <StarterTemplates onSelect={onTemplateSelect} />
          ) : (
            <Accordion>
              {presets.map((preset) => (
                <PresetCard
                  key={preset.id}
                  preset={preset}
                  roles={roles}
                  isExpanded={expandedPresetId === preset.id}
                  saving={savingPresetId === preset.id}
                  onToggle={() => onTogglePreset(preset.id)}
                  onSetDefault={onSetDefault}
                  onDuplicate={onDuplicate}
                  onDelete={onDelete}
                  onSave={onSavePreset}
                />
              ))}
            </Accordion>
          )}
        </div>
      </Card>
    </div>
  );
}
