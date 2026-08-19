"use client";

import { useState } from "react";
import type { ServicePlanStatus } from "@gather/lib";
import clsx from "clsx";
import { ChevronDown, ChevronUp, StickyNote, X } from "lucide-react";
import SelectMenu, { type SelectOption } from "../ui/SelectMenu";

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

const STATUS_OPTIONS: SelectOption[] = [
  { value: "PLANNED", label: "Planned", tone: "default" },
  { value: "DONE", label: "Done", tone: "success" },
  { value: "SKIPPED", label: "Skipped", tone: "warning" },
];

const memberLabel = (m: StepMemberOption) =>
  m.full_name?.trim() || m.email || m.id.slice(0, 8);

/** Minutes from service start → "9:05"-style clock offset. */
function offsetLabel(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function StepRow({
  step,
  index,
  members = [],
  selected,
  autoFocus,
  showStatus = false,
  offsetMinutes = 0,
  isFirst = false,
  isLast = false,
  onSelect,
  onUpdate,
  onRemove,
  onMove,
}: {
  step: RunOfShowStep;
  index: number;
  members?: StepMemberOption[];
  selected?: boolean;
  autoFocus?: boolean;
  showStatus?: boolean;
  /** Running total of prior step durations — shows when this step begins. */
  offsetMinutes?: number;
  isFirst?: boolean;
  isLast?: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<RunOfShowStep>) => void;
  onRemove: () => void;
  onMove: (direction: "up" | "down") => void;
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const showDetail = detailOpen || !!step.notes;

  const memberOptions: SelectOption[] = [
    { value: "", label: "Unassigned" },
    ...members.map((m) => ({ value: m.id, label: memberLabel(m) })),
  ];

  const isDone = step.status === "DONE";
  const isSkipped = step.status === "SKIPPED";

  return (
    <div
      className={clsx(
        "rounded-lg border bg-[var(--surface)] px-2 py-1.5 transition-colors",
        selected
          ? "border-amber-300 bg-[var(--primary-soft)]"
          : "border-[var(--border)] hover:border-[var(--outline-variant)]",
        isSkipped && "opacity-55"
      )}
      onClick={onSelect}
    >
      <div className="flex items-center gap-1.5">
        {/* Position + when it starts */}
        <div className="flex w-9 shrink-0 flex-col items-center leading-none">
          <span className="text-[11px] font-bold tabular-nums text-[var(--text-primary)]">
            {index + 1}
          </span>
          <span className="mt-0.5 text-[9px] tabular-nums text-[var(--text-muted)]">
            {offsetLabel(offsetMinutes)}
          </span>
        </div>

        <input
          value={step.title}
          autoFocus={autoFocus}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Step title"
          className={clsx(
            "h-8 min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 text-xs font-medium text-[var(--text-primary)] outline-none transition-colors placeholder:font-normal placeholder:text-[var(--text-muted)] hover:border-[var(--border)] focus:border-amber-300 focus:bg-[var(--surface)] focus:ring-2 focus:ring-[var(--primary-soft)]",
            isDone && "line-through decoration-[var(--text-muted)]"
          )}
        />

        {/* Duration */}
        <div className="flex h-8 w-[62px] shrink-0 items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] pl-1.5 pr-1 focus-within:border-amber-300">
          <input
            type="number"
            min={0}
            value={step.duration_minutes ?? ""}
            onChange={(e) => onUpdate({ duration_minutes: e.target.value ? Number(e.target.value) : null })}
            placeholder="–"
            aria-label="Duration in minutes"
            className="w-full min-w-0 border-0 bg-transparent p-0 text-right text-xs tabular-nums text-[var(--text-primary)] outline-none ring-0 placeholder:text-[var(--text-muted)] focus:ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="ml-0.5 shrink-0 text-[10px] text-[var(--text-muted)]">min</span>
        </div>

        {members.length > 0 && (
          <SelectMenu
            size="sm"
            searchable
            className="hidden w-[140px] shrink-0 md:block"
            ariaLabel="Assigned person"
            placeholder="Unassigned"
            value={step.assigned_user_id ?? ""}
            options={memberOptions}
            onChange={(v) => onUpdate({ assigned_user_id: v || null })}
          />
        )}

        {showStatus && (
          <SelectMenu
            size="sm"
            className="hidden w-[108px] shrink-0 sm:block"
            ariaLabel="Step status"
            value={step.status ?? "PLANNED"}
            options={STATUS_OPTIONS}
            onChange={(v) => onUpdate({ status: v as ServicePlanStatus })}
          />
        )}

        {/* Reorder */}
        <div className="flex shrink-0 flex-col">
          <button
            type="button"
            aria-label="Move step up"
            disabled={isFirst}
            onClick={(e) => { e.stopPropagation(); onMove("up"); }}
            className="flex h-4 w-5 items-center justify-center rounded text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] disabled:opacity-25"
          >
            <ChevronUp className="h-3 w-3" />
          </button>
          <button
            type="button"
            aria-label="Move step down"
            disabled={isLast}
            onClick={(e) => { e.stopPropagation(); onMove("down"); }}
            className="flex h-4 w-5 items-center justify-center rounded text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] disabled:opacity-25"
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>

        <button
          type="button"
          aria-label="Toggle step details"
          onClick={(e) => { e.stopPropagation(); setDetailOpen((o) => !o); }}
          className={clsx(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors",
            step.notes
              ? "border-amber-200 bg-amber-50 text-amber-600"
              : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
          )}
        >
          <StickyNote className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          aria-label="Remove step"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {showDetail && (
        <div className="mt-1.5 flex flex-col gap-1.5 pl-[42px] sm:flex-row sm:items-center">
          {members.length > 0 && (
            <SelectMenu
              size="sm"
              searchable
              className="w-full shrink-0 sm:w-[160px]"
              ariaLabel="Backup"
              placeholder="No backup"
              value={step.backup_user_id ?? ""}
              options={memberOptions.filter((o) => o.value !== step.assigned_user_id)}
              onChange={(v) => onUpdate({ backup_user_id: v || null })}
            />
          )}
          <input
            value={step.notes}
            onChange={(e) => onUpdate({ notes: e.target.value })}
            placeholder="Notes for this step…"
            className="h-8 min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-amber-300 focus:ring-2 focus:ring-[var(--primary-soft)]"
          />
        </div>
      )}
    </div>
  );
}
