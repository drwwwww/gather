"use client";

import { useState } from "react";
import { List } from "lucide-react";
import type { ServicePlanStatus } from "@gather/lib";

type PlanItem = {
  id: string;
  title: string;
  duration_minutes: number | null;
  notes: string;
  owner_role_id: string | null;
  assigned_user_id: string | null;
  backup_user_id: string | null;
  status: ServicePlanStatus;
};

type MemberOption = { id: string; full_name: string | null; email: string | null };

type PlanEditorProps = {
  planTitle: string;
  basedOnPresetName?: string | null;
  items: PlanItem[];
  members?: MemberOption[];
  onTitleChange: (value: string) => void;
  onItemsChange: (items: PlanItem[]) => void;
  onAddItem: () => void;
  onDeleteItem: (id: string) => void;
  onSave: () => void;
  saving?: boolean;
  error?: string | null;
};

const statusOptions: ServicePlanStatus[] = ["PLANNED", "DONE", "SKIPPED"];

export default function PlanEditor({
  planTitle,
  basedOnPresetName,
  items,
  members = [],
  onTitleChange,
  onItemsChange,
  onAddItem,
  onDeleteItem,
  onSave,
  saving,
  error
}: PlanEditorProps) {
  const [dragId, setDragId] = useState<string | null>(null);

  const moveItem = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const currentIndex = items.findIndex((item) => item.id === dragId);
    const targetIndex = items.findIndex((item) => item.id === targetId);
    if (currentIndex < 0 || targetIndex < 0) return;
    const updated = [...items];
    const [moved] = updated.splice(currentIndex, 1);
    updated.splice(targetIndex, 0, moved);
    onItemsChange(updated);
  };

  const handleItemChange = (id: string, patch: Partial<PlanItem>) => {
    onItemsChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  return (
    <div className="space-y-6">
      <div className="card shadow-sm p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-[240px]">
            <div className="card-title">Plan details</div>
            <div className="mt-3 space-y-3">
              <div>
                <label className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Title</label>
                <input type="text" value={planTitle} onChange={(event) => onTitleChange(event.target.value)} className="input input-bordered w-full" />
              </div>
              {basedOnPresetName ? (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Based on preset: {basedOnPresetName}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col items-start gap-2">
            <button type="button" onClick={onSave} disabled={saving} className="btn btn-primary-gradient">
              {saving ? "Saving..." : "Save plan"}
            </button>
            {error ? <p className="text-sm text-error">{error}</p> : null}
          </div>
        </div>
      </div>

      <div className="card shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="card-title">Service plan items</div>
          <button type="button" className="btn btn-outline btn-sm" onClick={onAddItem}>Add item</button>
        </div>
        <div className="mt-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-8 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)]">
                <List className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>No steps yet</p>
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Add a step to build your plan.</p>
              </div>
            </div>
          ) : (
            items.map((item, index) => (
              <div key={item.id} className="rounded-xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} draggable onDragStart={() => setDragId(item.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => moveItem(item.id)}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                    <span className="rounded-full px-2 py-1" style={{ background: 'var(--surface-2)', color: 'var(--text-primary)' }}>Step {index + 1}</span>
                    <span>Drag to reorder</span>
                  </div>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => onDeleteItem(item.id)}>Remove</button>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-[2fr_1fr]">
                  <div>
                    <label className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Title</label>
                    <input type="text" value={item.title} onChange={(event) => handleItemChange(item.id, { title: event.target.value })} className="input input-bordered w-full" />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Duration (min)</label>
                    <input type="number" min={0} value={item.duration_minutes ?? ""} onChange={(event) => { const value = event.target.value; handleItemChange(item.id, { duration_minutes: value ? Number(value) : null }); }} className="input input-bordered w-full" />
                  </div>
                </div>
                <div className="mt-3 max-w-xs">
                  <label
                    className="text-xs uppercase tracking-widest"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Status
                  </label>
                  <select
                    className="select select-bordered w-full mt-1"
                    style={{
                      background: 'var(--surface)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)'
                    }}
                    value={item.status}
                    onChange={(event) => handleItemChange(item.id, { status: event.target.value as ServicePlanStatus })}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                {members.length > 0 ? (
                  <div className="mt-3">
                    <label className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                      Assigned person
                    </label>
                    <select
                      className="select select-bordered w-full mt-1"
                      style={{
                        background: 'var(--surface)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)'
                      }}
                      value={item.assigned_user_id ?? ""}
                      onChange={(event) =>
                        handleItemChange(item.id, { assigned_user_id: event.target.value || null })
                      }
                    >
                      <option value="">— Open —</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.full_name?.trim() || m.email || m.id.slice(0, 8)}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
                <div className="mt-3">
                  <label className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Notes</label>
                  <textarea
                    className="textarea textarea-bordered w-full mt-1"
                    rows={3}
                    placeholder="Optional step notes..."
                    value={item.notes}
                    onChange={(event) => handleItemChange(item.id, { notes: event.target.value })}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
