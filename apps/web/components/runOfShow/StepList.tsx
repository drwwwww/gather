import StepRow, { type RunOfShowStep, type StepMemberOption } from "./StepRow";

export default function StepList({
  items,
  members,
  selectedId,
  focusId,
  showStatus = false,
  onSelect,
  onUpdate,
  onRemove,
  onReorder
}: {
  items: RunOfShowStep[];
  members?: StepMemberOption[];
  selectedId?: string | null;
  focusId?: string | null;
  showStatus?: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<RunOfShowStep>) => void;
  onRemove: (id: string) => void;
  onReorder: (next: RunOfShowStep[]) => void;
}) {
  const moveItem = (id: string, direction: "up" | "down") => {
    const index = items.findIndex((item) => item.id === id);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || targetIndex < 0 || targetIndex >= items.length) return;
    const updated = [...items];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    onReorder(updated);
  };

  return (
    <div className="relative pl-6">
      <div className="absolute left-3 top-2 bottom-2 w-px bg-[var(--divider)]" />
      <div className="space-y-3">
        {items.map((item, index) => (
          <StepRow
            key={item.id}
            step={item}
            index={index}
            members={members}
            selected={selectedId === item.id}
            autoFocus={focusId === item.id}
            showStatus={showStatus}
            onSelect={() => onSelect(item.id)}
            onUpdate={(patch) => onUpdate(item.id, patch)}
            onRemove={() => onRemove(item.id)}
            onMove={(direction) => moveItem(item.id, direction)}
          />
        ))}
      </div>
    </div>
  );
}
