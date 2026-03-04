"use client";

import { useState } from "react";
import type { Database, ServicePlanStatus } from "@gather/lib";

type RoleRow = Database["public"]["Tables"]["volunteer_roles"]["Row"];

type PlanItem = {
  id: string;
  title: string;
  duration_minutes: number | null;
  notes: string;
  owner_role_id: string | null;
  status: ServicePlanStatus;
};

type PlanEditorProps = {
  planTitle: string;
  basedOnPresetName?: string | null;
  items: PlanItem[];
  roles: RoleRow[];
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
  roles,
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
      <div className="card bg-base-100 shadow-md p-4 rounded-xl" style={{ background: 'var(--gather-surface)', borderColor: 'var(--gather-border)', color: 'var(--gather-ink)' }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-[240px]">
            <div className="card-title text-lg font-semibold">Plan details</div>
            <div className="mt-3 space-y-3">
              <div>
                <label className="text-xs uppercase tracking-widest" style={{ color: 'var(--gather-muted)' }}>Title</label>
                <input type="text" value={planTitle} onChange={(event) => onTitleChange(event.target.value)} className="input input-bordered w-full" />
              </div>
              {basedOnPresetName ? (
                <p className="text-xs" style={{ color: 'var(--gather-muted)' }}>
                  Based on preset: {basedOnPresetName}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col items-start gap-2">
            <button type="button" onClick={onSave} disabled={saving} className="btn btn-primary">
              {saving ? "Saving..." : "Save plan"}
            </button>
            {error ? <p className="text-sm text-error">{error}</p> : null}
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-md p-4 rounded-xl" style={{ background: 'var(--gather-surface)', borderColor: 'var(--gather-border)', color: 'var(--gather-ink)' }}>
        <div className="flex items-center justify-between">
          <div className="card-title text-lg font-semibold">Service plan items</div>
          <button type="button" className="btn btn-outline btn-sm" onClick={onAddItem}>Add item</button>
        </div>
        <div className="mt-4 space-y-4">
          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center" style={{ background: 'var(--gather-surface)', borderColor: 'var(--gather-border)', color: 'var(--gather-muted)' }}>
              <p className="text-sm">No steps yet.</p>
              <p className="mt-1 text-xs">Add a step to build your plan.</p>
            </div>
          ) : (
            items.map((item, index) => (
              <div key={item.id} className="rounded-xl border p-4" style={{ background: 'var(--gather-surface)', borderColor: 'var(--gather-border)', color: 'var(--gather-ink)' }} draggable onDragStart={() => setDragId(item.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => moveItem(item.id)}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-widest" style={{ color: 'var(--gather-muted)' }}>
                    <span className="rounded-full px-2 py-1" style={{ background: 'var(--gather-surface-2)', color: 'var(--gather-ink)' }}>Step {index + 1}</span>
                    <span>Drag to reorder</span>
                  </div>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => onDeleteItem(item.id)}>Remove</button>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-[2fr_1fr]">
                  <div>
                    <label className="text-xs uppercase tracking-widest" style={{ color: 'var(--gather-muted)' }}>Title</label>
                    <input type="text" value={item.title} onChange={(event) => handleItemChange(item.id, { title: event.target.value })} className="input input-bordered w-full" />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest" style={{ color: 'var(--gather-muted)' }}>Duration (min)</label>
                    <input type="number" min={0} value={item.duration_minutes ?? ""} onChange={(event) => { const value = event.target.value; handleItemChange(item.id, { duration_minutes: value ? Number(value) : null }); }} className="input input-bordered w-full" />
                  </div>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr]">
                  <div>
                    <label
                      className="text-xs uppercase tracking-widest"
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
                      onChange={(event) =>
                        handleItemChange(item.id, { owner_role_id: event.target.value || null })
                      }
                    >
                      <option value="">Unassigned</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      className="text-xs uppercase tracking-widest"
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
                      onChange={(event) => handleItemChange(item.id, { status: event.target.value as ServicePlanStatus })}
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-3">
                  <label
                    className="text-xs uppercase tracking-widest"
                    style={{ color: 'var(--gather-muted)' }}
                  >
                    Notes
                  </label>
                  <textarea
                    className="textarea textarea-bordered w-full"
                    rows={3}
                    style={{
                      background: 'var(--gather-surface)',
                      borderColor: 'var(--gather-border)',
                      color: 'var(--gather-ink)'
                    }}
                    value={item.notes}
                    onChange={(event) => handleItemChange(item.id, { notes: event.target.value })}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
