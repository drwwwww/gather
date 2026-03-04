import { useState } from "react";
import type { Database, ServicePlanStatus } from "@gather/lib";
import clsx from "clsx";
import StepNumberBadge from "./StepNumberBadge";

type RoleRow = Database["public"]["Tables"]["volunteer_roles"]["Row"];

export type RunOfShowStep = {
  id: string;
  title: string;
  duration_minutes: number | null;
  notes: string;
  owner_role_id: string | null;
  status?: ServicePlanStatus;
};

const statusOptions: ServicePlanStatus[] = ["PLANNED", "DONE", "SKIPPED"];

export default function StepRow({
  step,
  index,
  roles,
  selected,
  autoFocus,
  showStatus = false,
  onSelect,
  onUpdate,
  onRemove,
  onMove
}: {
  step: RunOfShowStep;
  index: number;
  roles: RoleRow[];
  selected?: boolean;
  autoFocus?: boolean;
  showStatus?: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<RunOfShowStep>) => void;
  onRemove: () => void;
  onMove: (direction: "up" | "down") => void;
}) {
  const [notesOpen, setNotesOpen] = useState(false);

  return (
    <div
      className={clsx(
        "rounded-xl border border-[rgba(60,40,20,0.12)] bg-[var(--gather-surface)] p-4 transition-all duration-200 ease-out",
        "hover:-translate-y-[2px] hover:border-[rgba(60,40,20,0.18)]",
        "hover:[box-shadow:0_6px_14px_rgba(31,26,20,0.08),inset_3px_0_0_0_rgba(196,138,42,0.8)]",
        "focus-within:-translate-y-[2px] focus-within:border-[rgba(60,40,20,0.18)]",
        "focus-within:[box-shadow:0_6px_14px_rgba(31,26,20,0.08),inset_3px_0_0_0_rgba(196,138,42,0.8)]",
        "motion-reduce:transform-none",
        selected && "bg-[var(--gather-primary-weak)]",
        selected && "[box-shadow:inset_3px_0_0_0_rgba(196,138,42,0.9)]"
      )}
      onClick={onSelect}
    >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <StepNumberBadge index={index} />
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--gather-muted)]">Step</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn btn-outline btn-sm" onClick={() => onMove("up")}>Up</button>
            <button className="btn btn-outline btn-sm" onClick={() => onMove("down")}>Down</button>
            <button className="btn btn-outline btn-sm" onClick={onRemove}>Remove</button>
          </div>
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-[2fr_1fr_1fr]">
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-[var(--gather-muted)]">Title</label>
            <Input
              value={step.title}
              onChange={(event) => onUpdate({ title: event.target.value })}
              className="bg-[var(--gather-surface)]"
              autoFocus={autoFocus}
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-[var(--gather-muted)]">Duration (min)</label>
            <Input
              type="number"
              min={0}
              value={step.duration_minutes ?? ""}
              onChange={(event) => {
                const value = event.target.value;
                onUpdate({ duration_minutes: value ? Number(value) : null });
              }}
              className="bg-[var(--gather-surface)]"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-[var(--gather-muted)]">Owner role</label>
            <select
              className="select select-bordered w-full"
              value={step.owner_role_id ?? ""}
              onChange={(event) => onUpdate({ owner_role_id: event.target.value || null })}
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
        {showStatus ? (
          <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto]">
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--gather-muted)]">Status</label>
              <select
                className="select select-bordered w-full"
                value={step.status ?? "PLANNED"}
                onChange={(event) => onUpdate({ status: event.target.value as ServicePlanStatus })}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button className="btn btn-outline btn-sm" onClick={() => setNotesOpen((prev) => !prev)}>
                {notesOpen ? "Hide notes" : "Notes"}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-end">
            <button className="btn btn-outline btn-sm" onClick={() => setNotesOpen((prev) => !prev)}>
              {notesOpen ? "Hide notes" : "Notes"}
            </button>
          </div>
        )}
        {notesOpen ? (
          <div className="mt-3">
            <label className="text-xs uppercase tracking-[0.2em] text-[var(--gather-muted)]">Notes</label>
            <textarea
              className="textarea textarea-bordered w-full"
              rows={3}
              value={step.notes}
              onChange={(event) => onUpdate({ notes: event.target.value })}
            />
          </div>
        ) : null}
    </div>
  );
}
