import { useEffect, useMemo, useState } from "react";
import type { Database } from "@gather/lib";
// ...existing code...
// ...existing code...
// ...existing code...
// ...existing code...
import { formatDurationMinutes } from "../../lib/format";
import PresetStepsEditor, { type PresetItemDraft } from "./PresetStepsEditor";
// ...existing code...

type ServicePreset = Database["public"]["Tables"]["service_presets"]["Row"];
type PresetItemRow = Database["public"]["Tables"]["service_preset_items"]["Row"];
type RoleRow = Database["public"]["Tables"]["volunteer_roles"]["Row"];

type PresetWithItems = ServicePreset & { items: PresetItemRow[] };

type PresetCardProps = {
  preset: PresetWithItems;
  roles: RoleRow[];
  isExpanded: boolean;
  saving?: boolean;
  onToggle: () => void;
  onSetDefault: (presetId: string) => void;
  onDuplicate: (preset: PresetWithItems) => void;
  onDelete: (preset: PresetWithItems) => void;
  onSave: (presetId: string, name: string, items: PresetItemDraft[]) => void;
};

export default function PresetCard({
  preset,
  roles,
  isExpanded,
  saving,
  onToggle,
  onSetDefault,
  onDuplicate,
  onDelete,
  onSave
}: PresetCardProps) {
  const [draftName, setDraftName] = useState(preset.name);
  const [draftItems, setDraftItems] = useState<PresetItemDraft[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    setDraftName(preset.name);
    setDraftItems(
      preset.items.map((item) => ({
        id: item.id,
        title: item.title,
        duration_minutes: item.duration_minutes,
        owner_role_id: item.owner_role_id,
        notes: item.notes ?? ""
      }))
    );
  }, [preset.id, preset.name, preset.items]);

  const stepCount = preset.items.length;
  const totalDuration = useMemo(
    () => preset.items.reduce((total, item) => total + (item.duration_minutes ?? 0), 0),
    [preset.items]
  );
  const durationLabel = formatDurationMinutes(totalDuration);
  const preview = useMemo(() => {
    const titles = preset.items.map((item) => item.title).filter(Boolean);
    if (!titles.length) return "No steps yet.";
    const previewTitles = titles.slice(0, 4).join(" -> ");
    return titles.length > 4 ? `${previewTitles}...` : previewTitles;
  }, [preset.items]);

  return (
    <Rail active={isExpanded} soft className="rounded-xl">
      <AccordionItem>
      <AccordionTrigger onClick={onToggle}>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-semibold text-[var(--gather-ink)]">{preset.name}</p>
          {preset.is_default ? <Badge>DEFAULT</Badge> : null}
        </div>
        <span className="text-xs text-[var(--gather-muted)]">{isExpanded ? "Hide" : "Edit"}</span>
      </AccordionTrigger>
      <div className="px-4 pb-4">
        <div className="space-y-2 text-sm">
          <p className="text-[var(--gather-muted)]">
            {stepCount} {stepCount === 1 ? "step" : "steps"}
            {durationLabel ? ` • ${durationLabel}` : ""}
          </p>
          <p className="text-xs text-[var(--gather-muted)]">{preview}</p>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {preset.is_default ? (
            <button className="btn btn-outline btn-sm" disabled>
              Default
            </button>
          ) : (
            <button className="btn btn-outline btn-sm" onClick={() => onSetDefault(preset.id)}>
              Set default
            </button>
          )}
          <button className="btn btn-outline btn-sm" onClick={() => onDuplicate(preset)}>
            Duplicate
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => setDeleteOpen(true)}>
            Delete
          </button>
        </div>
      </div>

      <AccordionContent isOpen={isExpanded}>
        <div className="space-y-4">
          <div className="grid gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-[var(--gather-muted)]">Preset name</label>
            <input value={draftName} onChange={(event) => setDraftName(event.target.value)} className="input input-bordered w-full" placeholder="Preset name" disabled={saving} />
          </div>
          <PresetStepsEditor
            items={draftItems}
            roles={roles}
            onItemsChange={setDraftItems}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[var(--gather-muted)]">Changes save to the preset and update the preview.</p>
            <button className="btn btn-primary btn-sm" onClick={() => onSave(preset.id, draftName, draftItems)} disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </AccordionContent>

      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="modal-box w-full max-w-md">
            <h3 className="font-bold text-lg mb-2">Delete preset?</h3>
            <p className="mb-4">This removes the preset and its steps. You can not undo this action.</p>
            <div className="modal-action flex gap-2 justify-end">
              <button className="btn btn-outline" onClick={() => setDeleteOpen(false)}>
                Cancel
              </button>
              <button
                className="btn btn-error"
                onClick={() => {
                  setDeleteOpen(false);
                  onDelete(preset);
                }}
              >
                Delete preset
              </button>
            </div>
          </div>
        </div>
      )}
      </AccordionItem>
    </Rail>
  );
}
