import { useState } from "react";
import type { ServicePlanStatus } from "@gather/lib";
import { Button } from "../ui/button";
import SelectMenu, { type SelectOption } from "../ui/SelectMenu";

export type PlanItemDraft = {
  id: string;
  title: string;
  duration_minutes: number | null;
  notes: string;
  owner_role_id: string | null;
  assigned_user_id: string | null;
  backup_user_id: string | null;
  status: ServicePlanStatus;
};

const statusOptions: SelectOption[] = [
  { value: "PLANNED", label: "Planned", tone: "default" },
  { value: "DONE", label: "Done", tone: "success" },
  { value: "SKIPPED", label: "Skipped", tone: "warning" },
];

export default function ServicePlanStepRow({
  item,
  index,
  autoFocus,
  onChange,
  onMove,
  onRemove
}: {
  item: PlanItemDraft;
  index: number;
  autoFocus?: boolean;
  onChange: (patch: Partial<PlanItemDraft>) => void;
  onMove: (direction: "up" | "down") => void;
  onRemove: () => void;
}) {
  const [notesOpen, setNotesOpen] = useState(false);

  return (
    <div
      className="rounded-xl border p-4"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        color: 'var(--text-primary)'
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="flex items-center gap-2 text-xs uppercase tracking-[0.2em]"
          style={{ color: 'var(--text-muted)' }}
        >
          <span>Step {index + 1}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => onMove("up")}
          >
            Up
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => onMove("down")}
          >
            Down
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onRemove}
          >
            Remove
          </button>
        </div>
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-[2fr_1fr]">
        <div>
          <label
            className="text-xs uppercase tracking-[0.2em]"
            style={{ color: 'var(--text-muted)' }}
          >
            Title
          </label>
          <input
            type="text"
            value={item.title}
            onChange={(event) => onChange({ title: event.target.value })}
            autoFocus={autoFocus}
            className="input input-bordered w-full"
          />
        </div>
        <div>
          <label
            className="text-xs uppercase tracking-[0.2em]"
            style={{ color: 'var(--text-muted)' }}
          >
            Duration (min)
          </label>
          <input
            type="number"
            min={0}
            value={item.duration_minutes ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              onChange({ duration_minutes: value ? Number(value) : null });
            }}
            className="input input-bordered w-full"
          />
        </div>
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto]">
        <div>
          <label
            className="text-xs uppercase tracking-[0.2em]"
            style={{ color: 'var(--text-muted)' }}
          >
            Status
          </label>
          <SelectMenu
            className="mt-1"
            ariaLabel="Step status"
            value={item.status}
            options={statusOptions}
            onChange={(v) => onChange({ status: v as ServicePlanStatus })}
          />
        </div>
        <div className="flex items-end">
          <Button size="sm" variant="secondary" onClick={() => setNotesOpen((prev) => !prev)}>
            {notesOpen ? "Hide notes" : "Notes"}
          </Button>
        </div>
      </div>
      {notesOpen ? (
        <div className="mt-3">
          <label className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>Notes</label>
          <textarea
            className="textarea textarea-bordered w-full mt-1"
            rows={3}
            placeholder="Optional step notes..."
            value={item.notes}
            onChange={(event) => onChange({ notes: event.target.value })}
          />
        </div>
      ) : null}
    </div>
  );
}
