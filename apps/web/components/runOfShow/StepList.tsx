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

  // Running start time for each step, so the list reads as a timeline
  // rather than a pile of independent rows.
  let elapsed = 0;
  const offsets = items.map((item) => {
    const at = elapsed;
    elapsed += item.duration_minutes ?? 0;
    return at;
  });

  return (
    <div className="space-y-1">
      {items.map((item, index) => (
        <StepRow
          key={item.id}
          step={item}
          index={index}
          members={members}
          selected={selectedId === item.id}
          autoFocus={focusId === item.id}
          showStatus={showStatus}
          offsetMinutes={offsets[index]}
          isFirst={index === 0}
          isLast={index === items.length - 1}
          onSelect={() => onSelect(item.id)}
          onUpdate={(patch) => onUpdate(item.id, patch)}
          onRemove={() => onRemove(item.id)}
          onMove={(direction) => moveItem(item.id, direction)}
        />
      ))}
      {items.length > 0 && (
        <div className="flex items-center justify-end gap-1.5 pt-1 pr-1 text-[11px] text-[var(--text-muted)]">
          <span>Total runtime</span>
          <span className="font-semibold tabular-nums text-[var(--text-primary)]">
            {Math.floor(elapsed / 60) > 0 ? `${Math.floor(elapsed / 60)}h ` : ""}
            {elapsed % 60}m
          </span>
        </div>
      )}
    </div>
  );
}
