import { useMemo, useState } from "react";
import { List } from "lucide-react";
import StepList from "../runOfShow/StepList";
import type { RunOfShowStep } from "../runOfShow/StepRow";
import StepEditorToolbar from "../runOfShow/StepEditorToolbar";

export type PresetItemDraft = {
  id: string;
  title: string;
  duration_minutes: number | null;
  owner_role_id: string | null;
  notes: string;
};

export default function PresetStepsEditor({
  items,
  onItemsChange
}: {
  items: PresetItemDraft[];
  onItemsChange: (items: PresetItemDraft[]) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const createLocalId = () => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `local-${Math.random().toString(16).slice(2)}`;
  };

  const steps = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        title: item.title,
        duration_minutes: item.duration_minutes,
        assigned_user_id: null,
        backup_user_id: null,
        notes: item.notes,
        status: undefined
      })),
    [items]
  );

  const handleUpdate = (id: string, patch: Partial<RunOfShowStep>) => {
    const safe: Partial<PresetItemDraft> = {
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.duration_minutes !== undefined ? { duration_minutes: patch.duration_minutes } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes } : {})
    };
    onItemsChange(items.map((item) => (item.id === id ? { ...item, ...safe } : item)));
  };

  const handleReorder = (nextSteps: RunOfShowStep[]) => {
    const order = new Map(nextSteps.map((step, index) => [step.id, index]));
    const updated = [...items].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    onItemsChange(updated);
  };

  const handleRemove = (id: string) => {
    onItemsChange(items.filter((item) => item.id !== id));
  };

  const handleAddStep = () => {
    const id = createLocalId();
    onItemsChange([
      ...items,
      {
        id,
        title: "",
        duration_minutes: null,
        owner_role_id: null,
        notes: ""
      }
    ]);
    setSelectedId(id);
  };

  const handleQuickAdd = (title: string) => {
    const id = createLocalId();
    onItemsChange([
      ...items,
      {
        id,
        title,
        duration_minutes: null,
        owner_role_id: null,
        notes: ""
      }
    ]);
    setSelectedId(id);
  };

  return (
    <div className="card shadow-sm p-4 rounded-2xl">
      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Run-of-show steps</p>
          <p className="text-xs text-[var(--text-muted)]">Shape the service flow with consistent steps.</p>
        </div>
        <StepEditorToolbar
          saving={false}
          onAddStep={handleAddStep}
          onAddQuickStep={handleQuickAdd}
        />
        {steps.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-8 text-center mt-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)]">
              <List className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>No steps yet</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Add the first step to start the flow.</p>
            </div>
          </div>
        ) : (
          <StepList
            items={steps}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId(id)}
            onUpdate={(id, patch) => handleUpdate(id, patch)}
            onRemove={handleRemove}
            onReorder={handleReorder}
          />
        )}
      </div>
    </div>
  );
}
