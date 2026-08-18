"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { Plus, ListPlus, ArrowRight, X } from "lucide-react";
import Link from "next/link";
import type { Database } from "@gather/lib";
import PresetCard from "./PresetCard";
import StarterTemplates from "./StarterTemplates";
import type { PresetItemDraft } from "./PresetStepsEditor";
import type { PresetTemplate } from "../../lib/presets";

type ServicePreset = Database["public"]["Tables"]["service_presets"]["Row"];
type PresetItemRow = Database["public"]["Tables"]["service_preset_items"]["Row"];
type PresetWithItems = ServicePreset & { items: PresetItemRow[] };

const WORSHIP_DAYS = [
  { index: undefined as number | undefined, label: "All days"  },
  { index: 0,  label: "Sunday"    },
  { index: 1,  label: "Monday"    },
  { index: 2,  label: "Tuesday"   },
  { index: 3,  label: "Wednesday" },
  { index: 4,  label: "Thursday"  },
  { index: 5,  label: "Friday"    },
  { index: 6,  label: "Saturday"  },
];

type PresetListProps = {
  worshipDay: number | undefined;
  presets: PresetWithItems[];
  expandedPresetId: string | null;
  newPresetName: string;
  onWorshipDayChange: (day: number | undefined) => void;
  onNewPresetNameChange: (value: string) => void;
  onCreatePreset: () => void;
  onTemplateSelect: (template: PresetTemplate) => void;
  onTogglePreset: (presetId: string) => void;
  onSetDefault: (presetId: string) => void;
  onDuplicate: (preset: PresetWithItems) => void;
  onDelete: (preset: PresetWithItems) => void;
  onSavePreset: (presetId: string, name: string, items: PresetItemDraft[]) => void;
  loading?: boolean;
  savingPresetId?: string | null;
  error?: string | null;
};

export default function PresetList({
  worshipDay,
  presets,
  expandedPresetId,
  newPresetName,
  onWorshipDayChange,
  onNewPresetNameChange,
  onCreatePreset,
  onTemplateSelect,
  onTogglePreset,
  onSetDefault,
  onDuplicate,
  onDelete,
  onSavePreset,
  loading,
  savingPresetId,
  error,
}: PresetListProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (createOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [createOpen]);

  const handleCreate = () => {
    onCreatePreset();
    setCreateOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top control bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4">
        {/* Worship day filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          {WORSHIP_DAYS.map(({ index, label }) => (
            <button
              key={label}
              type="button"
              onClick={() => onWorshipDayChange(index)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                worshipDay === index
                  ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
                  : "text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/service-plans"
            className="hidden items-center gap-1.5 text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-amber-600 sm:flex"
          >
            Go to service plans
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="btn btn-primary-gradient btn-sm flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New preset
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {/* Preset list */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface)]" />
            ))}
          </div>
        ) : presets.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-10">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-2)]">
                <ListPlus className="h-6 w-6 text-[var(--text-muted)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">No presets yet</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">Create a blank preset or start from one of the templates below.</p>
              </div>
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="btn btn-primary-gradient btn-sm"
              >
                Create your first preset
              </button>
            </div>
            <div className="mt-8 border-t border-[var(--border)] pt-6">
              <StarterTemplates onSelect={(t) => { onTemplateSelect(t); }} />
            </div>
          </div>
        ) : (
          <>
            {presets.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                isExpanded={expandedPresetId === preset.id}
                saving={savingPresetId === preset.id}
                onToggle={() => onTogglePreset(preset.id)}
                onSetDefault={onSetDefault}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
                onSave={onSavePreset}
              />
            ))}
            <div className="border-t border-[var(--border)] pt-4">
              <StarterTemplates onSelect={onTemplateSelect} />
            </div>
          </>
        )}
      </div>

      {/* Create preset modal */}
      {createOpen && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setCreateOpen(false)}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <h2 className="text-base font-bold text-[var(--text-primary)]">New preset</h2>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                  Preset name
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={newPresetName}
                  onChange={(e) => onNewPresetNameChange(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && newPresetName.trim()) handleCreate(); }}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100"
                  placeholder="e.g. Sunday Traditional Service"
                />
                <p className="text-xs text-[var(--text-muted)]">You can add steps after creating.</p>
              </div>
            </div>
            <div className="flex gap-3 border-t border-[var(--border)] px-5 py-4">
              <button
                type="button"
                className="btn btn-secondary flex-1"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newPresetName.trim()}
                className="btn btn-primary-gradient flex-1"
                onClick={handleCreate}
              >
                Create
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
