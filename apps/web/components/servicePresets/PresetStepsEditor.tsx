import type { Database } from "@gather/lib";
import { useMemo, useState } from "react";
// ...existing code...
import StepList from "../runOfShow/StepList";
import StepEditorToolbar from "../runOfShow/StepEditorToolbar";

export type PresetItemDraft = {
  id: string;
  title: string;
  duration_minutes: number | null;
  owner_role_id: string | null;
  notes: string;
};

type RoleRow = Database["public"]["Tables"]["volunteer_roles"]["Row"];

export default function PresetStepsEditor({
  items,
  roles,
  onItemsChange
}: {
  items: PresetItemDraft[];
  roles: RoleRow[];
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
        owner_role_id: item.owner_role_id,
        notes: item.notes,
        status: undefined
      })),
    [items]
  );

  const handleUpdate = (id: string, patch: Partial<PresetItemDraft>) => {
    onItemsChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const handleReorder = (nextSteps: typeof steps) => {
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
    <div className="card bg-base-100 shadow-md p-4 rounded-2xl">
      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-[var(--gather-ink)]">Run-of-show steps</p>
          <p className="text-xs text-[var(--gather-muted)]">Shape the service flow with consistent steps.</p>
        </div>
        <StepEditorToolbar
          saving={false}
          onAddStep={handleAddStep}
          onAddQuickStep={handleQuickAdd}
        />
        {steps.length === 0 ? (
          <div className="rounded-xl border border-dashed border-base-300 p-5 text-center">
            <p className="text-sm text-[var(--gather-muted)]">No steps yet.</p>
            <p className="text-xs text-[var(--gather-muted)] mt-1">Add the first step to start the flow.</p>
          </div>
        ) : (
          <StepList
            items={steps}
            roles={roles}
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
