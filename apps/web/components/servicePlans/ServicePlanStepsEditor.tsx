import type { Database } from "@gather/lib";
import { useEffect, useMemo, useState } from "react";
import StepList from "../runOfShow/StepList";
import StepEditorToolbar from "../runOfShow/StepEditorToolbar";
import { type PlanItemDraft } from "./ServicePlanStepRow";

type RoleRow = Database["public"]["Tables"]["volunteer_roles"]["Row"];

export default function ServicePlanStepsEditor({
  items,
  roles,
  savingState,
  focusItemId,
  onItemsChange,
  onAddStep,
  onAddQuickStep
}: {
  items: PlanItemDraft[];
  roles: RoleRow[];
  savingState?: "idle" | "saving" | "saved" | "error";
  focusItemId?: string | null;
  onItemsChange: (items: PlanItemDraft[]) => void;
  onAddStep: () => void;
  onAddQuickStep: (title: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (focusItemId) {
      setSelectedId(focusItemId);
    }
  }, [focusItemId]);

  useEffect(() => {
    if (savingState === "saved") {
      setLastSavedAt(new Date());
    }
  }, [savingState]);

  const steps = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        title: item.title,
        duration_minutes: item.duration_minutes,
        owner_role_id: item.owner_role_id,
        notes: item.notes,
        status: item.status
      })),
    [items]
  );

  const handleItemChange = (id: string, patch: Partial<PlanItemDraft>) => {
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

  return (
    <div
      className="card shadow-sm p-4 rounded-2xl"
      style={{
        background: 'var(--gather-surface)',
        borderColor: 'var(--gather-border)',
        color: 'var(--gather-ink)'
      }}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: 'var(--gather-ink)' }}
            >
              Service plan steps
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: 'var(--gather-muted)' }}
            >
              Keep the flow and assignments in one place.
            </p>
          </div>
        </div>
        <StepEditorToolbar
          saving={savingState === "saving"}
          lastSavedAt={lastSavedAt}
          onAddStep={onAddStep}
          onAddQuickStep={onAddQuickStep}
        />
        {steps.length === 0 ? (
          <div
            className="rounded-xl border border-dashed p-6 text-center"
            style={{
              background: 'var(--gather-surface)',
              borderColor: 'var(--gather-border)',
              color: 'var(--gather-muted)'
            }}
          >
            <p className="text-sm" style={{ color: 'var(--gather-muted)' }}>
              No steps yet.
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--gather-muted)' }}>
              Add a step to build your plan.
            </p>
          </div>
        ) : (
          <StepList
            items={steps}
            roles={roles}
            selectedId={selectedId}
            focusId={focusItemId}
            showStatus
            onSelect={(id) => setSelectedId(id)}
            onUpdate={(id, patch) => handleItemChange(id, patch)}
            onRemove={handleRemove}
            onReorder={handleReorder}
          />
        )}
      </div>
    </div>
  );
}
