"use client";

import type { Database } from "@gather/lib";
import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardTitle } from "../ui/card";
import { Input } from "../ui/input";

type ServiceTime = Database["public"]["Tables"]["service_times"]["Row"];
type ServicePreset = Database["public"]["Tables"]["service_presets"]["Row"];
type RoleRow = Database["public"]["Tables"]["volunteer_roles"]["Row"];

type PresetItem = {
  id: string;
  title: string;
  duration_minutes: number | null;
  notes: string;
  owner_role_id: string | null;
};

type PresetEditorProps = {
  preset: ServicePreset | null;
  serviceTimes: ServiceTime[];
  roles: RoleRow[];
  items: PresetItem[];
  onPresetChange: (patch: Partial<ServicePreset>) => void;
  onItemsChange: (items: PresetItem[]) => void;
  onAddItem: () => void;
  onDeleteItem: (id: string) => void;
  onSave: () => void;
  onSetDefault?: () => void;
  saving?: boolean;
  error?: string | null;
};

export default function PresetEditor({
  preset,
  serviceTimes,
  roles,
  items,
  onPresetChange,
  onItemsChange,
  onAddItem,
  onDeleteItem,
  onSave,
  onSetDefault,
  saving,
  error
}: PresetEditorProps) {
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

  const handleItemChange = (id: string, patch: Partial<PresetItem>) => {
    onItemsChange(
      items.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-[240px]">
            <CardTitle>Preset details</CardTitle>
            <div className="mt-3 space-y-3">
              <div>
                <label className="text-xs uppercase tracking-widest text-[var(--gather-muted)]">Name</label>
                <Input
                  value={preset?.name ?? ""}
                  onChange={(event) => onPresetChange({ name: event.target.value })}
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-[var(--gather-muted)]">Service time</label>
                <select
                  className="select select-bordered w-full"
                  value={preset?.service_time_id ?? ""}
                  onChange={(event) => onPresetChange({ service_time_id: event.target.value })}
                >
                  {serviceTimes.map((time) => (
                    <option key={time.id} value={time.id}>
                      {time.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start gap-2">
            {preset?.is_default ? (
              <span className="badge badge-secondary">Default preset</span>
            ) : onSetDefault ? (
              <Button variant="outline" size="sm" onClick={onSetDefault}>
                Set as default
              </Button>
            ) : null}
            <Button onClick={onSave} disabled={saving}>
              {saving ? "Saving..." : "Save preset"}
            </Button>
            {error ? <p className="text-sm text-error">{error}</p> : null}
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>Run of show items</CardTitle>
          <Button size="sm" onClick={onAddItem}>Add item</Button>
        </div>
        <div className="mt-4 space-y-4">
          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-base-300 p-6 text-center">
              <p className="text-sm text-[var(--gather-muted)]">No steps yet.</p>
              <p className="mt-1 text-xs text-[var(--gather-muted)]">Add a step to build your run of show.</p>
            </div>
          ) : (
            items.map((item, index) => (
              <div
                key={item.id}
                className="rounded-xl border border-base-200 bg-base-100 p-4"
                draggable
                onDragStart={() => setDragId(item.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => moveItem(item.id)}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[var(--gather-muted)]">
                    <span className="rounded-full bg-base-200 px-2 py-1">Step {index + 1}</span>
                    <span>Drag to reorder</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => onDeleteItem(item.id)}>
                    Remove
                  </Button>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-[2fr_1fr]">
                  <div>
                    <label className="text-xs uppercase tracking-widest text-[var(--gather-muted)]">Title</label>
                    <Input
                      value={item.title}
                      onChange={(event) => handleItemChange(item.id, { title: event.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-[var(--gather-muted)]">Duration (min)</label>
                    <Input
                      type="number"
                      min={0}
                      value={item.duration_minutes ?? ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        handleItemChange(item.id, { duration_minutes: value ? Number(value) : null });
                      }}
                    />
                  </div>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr]">
                  <div>
                    <label className="text-xs uppercase tracking-widest text-[var(--gather-muted)]">Owner role</label>
                    <select
                      className="select select-bordered w-full"
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
                    <label className="text-xs uppercase tracking-widest text-[var(--gather-muted)]">Notes</label>
                    <textarea
                      className="textarea textarea-bordered w-full"
                      rows={3}
                      value={item.notes}
                      onChange={(event) => handleItemChange(item.id, { notes: event.target.value })}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
