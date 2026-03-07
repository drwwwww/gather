import { useState } from "react";
import type { Database, ServicePlanStatus } from "@gather/lib";
import { Button } from "../ui/button";

export type PlanItemDraft = {
  id: string;
  title: string;
  duration_minutes: number | null;
  notes: string;
  owner_role_id: string | null;
  status: ServicePlanStatus;
};

type RoleRow = Database["public"]["Tables"]["volunteer_roles"]["Row"];

const statusOptions: ServicePlanStatus[] = ["PLANNED", "DONE", "SKIPPED"];

export default function ServicePlanStepRow({
  item,
  index,
  roles,
  autoFocus,
  onChange,
  onMove,
  onRemove
}: {
  item: PlanItemDraft;
  index: number;
  roles: RoleRow[];
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
        background: 'var(--gather-surface)',
        borderColor: 'var(--gather-border)',
        color: 'var(--gather-ink)'
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="flex items-center gap-2 text-xs uppercase tracking-[0.2em]"
          style={{ color: 'var(--gather-muted)' }}
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
      <div className="mt-3 grid gap-3 lg:grid-cols-[2fr_1fr_1fr]">
        <div>
          <label
            className="text-xs uppercase tracking-[0.2em]"
            style={{ color: 'var(--gather-muted)' }}
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
            style={{ color: 'var(--gather-muted)' }}
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
        <div>
          <label
            className="text-xs uppercase tracking-[0.2em]"
            style={{ color: 'var(--gather-muted)' }}
          >
            Owner role
          </label>
          <select
            className="select select-bordered w-full"
            style={{
              background: 'var(--gather-surface)',
              borderColor: 'var(--gather-border)',
              color: 'var(--gather-ink)'
            }}
            value={item.owner_role_id ?? ""}
            onChange={(event) => onChange({ owner_role_id: event.target.value || null })}
          >
            <option value="">Unassigned</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto]">
        <div>
          <label
            className="text-xs uppercase tracking-[0.2em]"
            style={{ color: 'var(--gather-muted)' }}
          >
            Status
          </label>
          <select
            className="select select-bordered w-full"
            style={{
              background: 'var(--gather-surface)',
              borderColor: 'var(--gather-border)',
              color: 'var(--gather-ink)'
            }}
            value={item.status}
            onChange={(event) => onChange({ status: event.target.value as ServicePlanStatus })}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <Button size="sm" variant="secondary" onClick={() => setNotesOpen((prev) => !prev)}>
            {notesOpen ? "Hide notes" : "Notes"}
          </Button>
        </div>
      </div>
      {notesOpen ? (
        <div className="mt-3">
          <label className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--gather-muted)' }}>Notes</label>
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
