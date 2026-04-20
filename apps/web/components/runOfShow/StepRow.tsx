import { useState } from "react";
import type { ServicePlanStatus } from "@gather/lib";
import clsx from "clsx";
import StepNumberBadge from "./StepNumberBadge";
import { Input } from "../ui/input";

export type RunOfShowStep = {
  id: string;
  title: string;
  duration_minutes: number | null;
  notes: string;
  assigned_user_id: string | null;
  backup_user_id: string | null;
  status?: ServicePlanStatus;
};

export type StepMemberOption = {
  id: string;
  full_name: string | null;
  email: string | null;
};

const statusOptions: ServicePlanStatus[] = ["PLANNED", "DONE", "SKIPPED"];

export default function StepRow({
  step,
  index,
  members = [],
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
  members?: StepMemberOption[];
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
        "rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-all duration-200 ease-out",
        "hover:-translate-y-[2px] hover:border-[var(--border-hover,var(--border))]",
        "hover:[box-shadow:0_6px_14px_rgba(0,0,0,0.06),inset_3px_0_0_0_var(--primary)]",
        "focus-within:-translate-y-[2px] focus-within:border-[var(--border-hover,var(--border))]",
        "focus-within:[box-shadow:0_6px_14px_rgba(0,0,0,0.06),inset_3px_0_0_0_var(--primary)]",
        "motion-reduce:transform-none",
        selected && "bg-[var(--primary-soft)]",
        selected && "[box-shadow:inset_3px_0_0_0_var(--primary)]"
      )}
      onClick={onSelect}
    >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <StepNumberBadge index={index} />
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Step</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn btn-outline btn-sm" onClick={() => onMove("up")}>Up</button>
            <button className="btn btn-outline btn-sm" onClick={() => onMove("down")}>Down</button>
            <button className="btn btn-outline btn-sm" onClick={onRemove}>Remove</button>
          </div>
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-[2fr_1fr]">
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Title</label>
            <Input
              value={step.title}
              onChange={(event) => onUpdate({ title: event.target.value })}
              className="bg-[var(--surface)]"
              autoFocus={autoFocus}
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Duration (min)</label>
            <Input
              type="number"
              min={0}
              value={step.duration_minutes ?? ""}
              onChange={(event) => {
                const value = event.target.value;
                onUpdate({ duration_minutes: value ? Number(value) : null });
              }}
              className="bg-[var(--surface)]"
            />
          </div>
        </div>
        {members.length > 0 ? (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Assigned person</label>
              <select
                className="select select-bordered w-full mt-1"
                value={step.assigned_user_id ?? ""}
                onChange={(event) => onUpdate({ assigned_user_id: event.target.value || null })}
              >
                <option value="">— Open —</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name?.trim() || m.email || m.id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Backup</label>
              <select
                className="select select-bordered w-full mt-1"
                value={step.backup_user_id ?? ""}
                onChange={(event) => onUpdate({ backup_user_id: event.target.value || null })}
              >
                <option value="">— None —</option>
                {members
                  .filter((m) => m.id !== step.assigned_user_id)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name?.trim() || m.email || m.id.slice(0, 8)}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        ) : null}
        {showStatus ? (
          <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto]">
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Status</label>
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
            <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Notes</label>
            <textarea
              className="textarea textarea-bordered w-full mt-1"
              rows={3}
              placeholder="Optional step notes..."
              value={step.notes}
              onChange={(event) => onUpdate({ notes: event.target.value })}
            />
          </div>
        ) : null}
    </div>
  );
}
