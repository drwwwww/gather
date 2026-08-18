"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, MoreHorizontal, Star, Copy, Trash2, Check } from "lucide-react";
import type { Database } from "@gather/lib";
import { formatDurationMinutes } from "../../lib/format";
import PresetStepsEditor, { type PresetItemDraft } from "./PresetStepsEditor";

type ServicePreset = Database["public"]["Tables"]["service_presets"]["Row"];
type PresetItemRow = Database["public"]["Tables"]["service_preset_items"]["Row"];
type PresetWithItems = ServicePreset & { items: PresetItemRow[] };

type PresetCardProps = {
  preset: PresetWithItems;
  isExpanded: boolean;
  saving?: boolean;
  onToggle: () => void;
  onSetDefault: (presetId: string) => void;
  onDuplicate: (preset: PresetWithItems) => void;
  onDelete: (preset: PresetWithItems) => void;
  onSave: (presetId: string, name: string, items: PresetItemDraft[]) => void;
};

export default function PresetCard({
  preset,
  isExpanded,
  saving,
  onToggle,
  onSetDefault,
  onDuplicate,
  onDelete,
  onSave,
}: PresetCardProps) {
  const [draftName, setDraftName] = useState(preset.name);
  const [draftItems, setDraftItems] = useState<PresetItemDraft[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{ top: number; right: number } | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setDraftName(preset.name);
    setDraftItems(
      preset.items.map((item) => ({
        id: item.id,
        title: item.title,
        duration_minutes: item.duration_minutes,
        owner_role_id: item.owner_role_id,
        notes: item.notes ?? "",
      }))
    );
  }, [preset.id, preset.name, preset.items]);

  const stepCount = preset.items.length;
  const totalDuration = useMemo(
    () => preset.items.reduce((t, i) => t + (i.duration_minutes ?? 0), 0),
    [preset.items]
  );
  const durationLabel = formatDurationMinutes(totalDuration);

  const preview = useMemo(() => {
    const titles = preset.items.map((i) => i.title).filter(Boolean);
    if (!titles.length) return "No steps yet — click to add";
    return titles.slice(0, 4).join(" → ") + (titles.length > 4 ? " …" : "");
  }, [preset.items]);

  return (
    <>
      <div className={`overflow-hidden rounded-2xl border bg-[var(--surface)] transition-all duration-200 ${isExpanded ? "border-amber-300 shadow-md" : "border-[var(--border)] hover:border-[var(--outline-variant)]"}`}>
        {/* Row header */}
        <div className="flex items-center gap-3 px-5 py-4">
          {/* Default indicator */}
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${preset.is_default ? "bg-amber-100 text-amber-600" : "bg-[var(--surface-2)] text-[var(--text-muted)]"}`}>
            <Star className={`h-4 w-4 ${preset.is_default ? "fill-amber-400 text-amber-500" : ""}`} />
          </div>

          {/* Name + meta */}
          <button
            type="button"
            onClick={onToggle}
            className="flex min-w-0 flex-1 items-center gap-3 text-left focus:outline-none"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{preset.name}</p>
              <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">{preview}</p>
            </div>
          </button>

          {/* Step count + duration chip */}
          <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
            <span className="rounded-full bg-[var(--surface-container-low)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
              {stepCount} {stepCount === 1 ? "step" : "steps"}
              {durationLabel ? ` · ${durationLabel}` : ""}
            </span>
          </div>

          {/* Actions menu */}
          <div className="shrink-0">
            <button
              ref={menuBtnRef}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!menuBtnRef.current) return;
                const r = menuBtnRef.current.getBoundingClientRect();
                setMenuAnchor({ top: r.bottom + 6, right: window.innerWidth - r.right });
                setMenuOpen((o) => !o);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>

          {/* Expand chevron */}
          <button
            type="button"
            onClick={onToggle}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)]"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Expanded editor */}
        {isExpanded && (
          <div className="border-t border-[var(--border)] bg-[var(--surface-container-low)] px-5 py-5 space-y-5">
            {/* Name field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                Preset name
              </label>
              <input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100"
                placeholder="e.g. Sunday Traditional Service"
                disabled={saving}
              />
            </div>

            {/* Steps editor */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                Steps
              </label>
              <PresetStepsEditor items={draftItems} onItemsChange={setDraftItems} />
            </div>

            {/* Save row */}
            <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
              <p className="text-xs text-[var(--text-muted)]">Changes apply when you save.</p>
              <button
                type="button"
                disabled={saving}
                onClick={() => onSave(preset.id, draftName, draftItems)}
                className="btn btn-primary-gradient btn-sm flex items-center gap-2"
              >
                {saving ? (
                  "Saving…"
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Save changes
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Actions menu portal — floats over the card overflow */}
      {menuOpen && menuAnchor && typeof document !== "undefined" && createPortal(
        <>
          <div className="fixed inset-0 z-[999]" onClick={() => setMenuOpen(false)} />
          <div
            className="fixed z-[1000] w-52 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg"
            style={{ top: menuAnchor.top, right: menuAnchor.right }}
          >
            {!preset.is_default && (
              <button
                type="button"
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-2)]"
                onClick={() => { onSetDefault(preset.id); setMenuOpen(false); }}
              >
                <Star className="h-4 w-4 text-[var(--text-muted)]" />
                Set as default
              </button>
            )}
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-2)]"
              onClick={() => { onDuplicate(preset); setMenuOpen(false); }}
            >
              <Copy className="h-4 w-4 text-[var(--text-muted)]" />
              Duplicate
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-500 transition-colors hover:bg-red-50"
              onClick={() => { setDeleteOpen(true); setMenuOpen(false); }}
            >
              <Trash2 className="h-4 w-4" />
              Delete preset
            </button>
          </div>
        </>,
        document.body
      )}

      {/* Delete confirmation modal */}
      {deleteOpen && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setDeleteOpen(false)}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">Delete "{preset.name}"?</h3>
              <p className="mt-1.5 text-sm text-[var(--text-muted)]">
                This removes the preset and all {stepCount} {stepCount === 1 ? "step" : "steps"}. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 border-t border-[var(--border)] px-6 py-4">
              <button
                type="button"
                className="btn btn-secondary flex-1"
                onClick={() => setDeleteOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600 focus:outline-none"
                onClick={() => { setDeleteOpen(false); onDelete(preset); }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
