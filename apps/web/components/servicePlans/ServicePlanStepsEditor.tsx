import { useEffect, useMemo, useState } from "react";
import { List } from "lucide-react";
import StepList from "../runOfShow/StepList";
import type { RunOfShowStep, StepMemberOption } from "../runOfShow/StepRow";
import StepEditorToolbar from "../runOfShow/StepEditorToolbar";
import { type PlanItemDraft } from "./ServicePlanStepRow";

export default function ServicePlanStepsEditor({
  items,
  members = [],
  savingState,
  focusItemId,
  onItemsChange,
  onAddStep,
  onAddQuickStep
}: {
  items: PlanItemDraft[];
  members?: StepMemberOption[];
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
        assigned_user_id: item.assigned_user_id ?? null,
        backup_user_id: item.backup_user_id ?? null,
        notes: item.notes,
        status: item.status
      })),
    [items]
  );

  const handleItemChange = (id: string, patch: Partial<PlanItemDraft>) => {
    onItemsChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const handleReorder = (nextSteps: RunOfShowStep[]) => {
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
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        color: 'var(--text-primary)'
      }}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Service plan steps
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: 'var(--text-muted)' }}
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
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-8 text-center mt-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)]">
              <List className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>No steps yet</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Add a step to build your plan.</p>
            </div>
          </div>
        ) : (
          <StepList
            items={steps}
            members={members}
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
