import { useEffect, useMemo, useState } from "react";
import type { Database } from "@gather/lib";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { formatDurationMinutes } from "../../lib/format";
import PresetStepsEditor, { type PresetItemDraft } from "./PresetStepsEditor";
import Rail from "../ui/Rail";

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
            <Button size="sm" variant="outline" disabled>
              Default
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => onSetDefault(preset.id)}>
              Set default
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => onDuplicate(preset)}>
            Duplicate
          </Button>
          <Button size="sm" variant="outline" onClick={() => setDeleteOpen(true)}>
            Delete
          </Button>
        </div>
      </div>

      <AccordionContent isOpen={isExpanded}>
        <div className="space-y-4">
          <div className="grid gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-[var(--gather-muted)]">Preset name</label>
            <Input value={draftName} onChange={(event) => setDraftName(event.target.value)} />
          </div>
          <PresetStepsEditor
            items={draftItems}
            roles={roles}
            onItemsChange={setDraftItems}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[var(--gather-muted)]">Changes save to the preset and update the preview.</p>
            <Button size="sm" onClick={() => onSave(preset.id, draftName, draftItems)} disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </div>
      </AccordionContent>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete preset?</DialogTitle>
            <DialogDescription>
              This removes the preset and its steps. You can not undo this action.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setDeleteOpen(false);
                onDelete(preset);
              }}
            >
              Delete preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </AccordionItem>
    </Rail>
  );
}
