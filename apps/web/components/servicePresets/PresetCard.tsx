import { useEffect, useMemo, useState } from "react";
import type { Database } from "@gather/lib";
import { formatDurationMinutes } from "../../lib/format";
import PresetStepsEditor, { type PresetItemDraft } from "./PresetStepsEditor";
import Badge from "../ui/Badge";

type ServicePreset = Database["public"]["Tables"]["service_presets"]["Row"];
type PresetItemRow = Database["public"]["Tables"]["service_preset_items"]["Row"];
type PresetWithItems = ServicePreset & { items: PresetItemRow[] };

type PresetCardProps = {
  preset: PresetWithItems;
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
    <div
      className={`card shadow-sm overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] ${isExpanded ? "ring-2 ring-[var(--primary-soft)]" : ""}`}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--surface-2)]"
        onClick={onToggle}
      >
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{preset.name}</p>
          {preset.is_default ? <Badge>DEFAULT</Badge> : null}
        </div>
        <span className="text-xs text-[var(--text-muted)] shrink-0">{isExpanded ? "Hide" : "Edit"}</span>
      </button>
      <div className="border-t border-[var(--border)] px-4 pb-4 pt-2">
        <div className="space-y-2 text-sm">
          <p className="text-[var(--text-muted)]">
            {stepCount} {stepCount === 1 ? "step" : "steps"}
            {durationLabel ? ` • ${durationLabel}` : ""}
          </p>
          <p className="text-xs text-[var(--text-muted)]">{preview}</p>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {preset.is_default ? (
            <button type="button" className="btn btn-outline btn-sm" disabled>
              Default
            </button>
          ) : (
            <button type="button" className="btn btn-outline btn-sm" onClick={() => onSetDefault(preset.id)}>
              Set default
            </button>
          )}
          <button type="button" className="btn btn-outline btn-sm" onClick={() => onDuplicate(preset)}>
            Duplicate
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setDeleteOpen(true)}>
            Delete
          </button>
        </div>
      </div>

      {isExpanded ? (
        <div className="space-y-4 border-t border-[var(--border)] px-4 py-4">
          <div className="grid gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Preset name</label>
            <input value={draftName} onChange={(event) => setDraftName(event.target.value)} className="input input-bordered w-full" placeholder="Preset name" disabled={saving} />
          </div>
          <PresetStepsEditor items={draftItems} onItemsChange={setDraftItems} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[var(--text-muted)]">Changes save to the preset and update the preview.</p>
            <button type="button" className="btn btn-primary-gradient btn-sm" onClick={() => onSave(preset.id, draftName, draftItems)} disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      ) : null}

      {deleteOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="modal-box w-full max-w-md">
            <h3 className="font-bold text-lg mb-2">Delete preset?</h3>
            <p className="mb-4">This removes the preset and its steps. You can not undo this action.</p>
            <div className="modal-action flex gap-2 justify-end">
              <button type="button" className="btn btn-outline" onClick={() => setDeleteOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
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
      ) : null}
    </div>
  );
}
