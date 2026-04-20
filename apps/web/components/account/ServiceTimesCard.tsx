"use client";

import { useState } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "../ui/button";

export type ServiceTimeItem = {
  id: string;
  name: string;
  day_of_week: number;
  start_time: string;
  timezone: string;
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatTime(t: string) {
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

type Draft = { name: string; day_of_week: number; start_time: string };
const emptyDraft = (): Draft => ({ name: "Main Service", day_of_week: 0, start_time: "09:00" });

export default function ServiceTimesCard({
  serviceTimes,
  onAdd,
  onUpdate,
  onDelete,
}: {
  serviceTimes: ServiceTimeItem[];
  onAdd: (draft: Draft) => Promise<void>;
  onUpdate: (id: string, patch: Partial<Draft>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [addDraft, setAddDraft] = useState<Draft>(emptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(emptyDraft());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!addDraft.name.trim() || saving) return;
    setSaving(true);
    await onAdd(addDraft);
    setAddDraft(emptyDraft());
    setShowAdd(false);
    setSaving(false);
  };

  const startEdit = (st: ServiceTimeItem) => {
    setEditingId(st.id);
    setEditDraft({ name: st.name, day_of_week: st.day_of_week, start_time: st.start_time });
    setConfirmDeleteId(null);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editDraft.name.trim() || saving) return;
    setSaving(true);
    await onUpdate(editingId, editDraft);
    setEditingId(null);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (confirmDeleteId === id) {
      setSaving(true);
      await onDelete(id);
      setConfirmDeleteId(null);
      setSaving(false);
    } else {
      setConfirmDeleteId(id);
    }
  };

  return (
    <div className="card shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="card-title text-base">Service Times</span>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            When your regular services take place.
          </p>
        </div>
        {!showAdd && (
          <Button variant="secondary" size="sm" onClick={() => { setShowAdd(true); setAddDraft(emptyDraft()); }}>
            + Add
          </Button>
        )}
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>New service time</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="flex flex-col gap-1 sm:col-span-3">
              <label className="text-xs uppercase tracking-[0.15em]" style={{ color: "var(--text-muted)" }}>Name</label>
              <input
                type="text"
                className="input input-bordered input-sm w-full"
                placeholder="e.g. Main Service, Early Service"
                value={addDraft.name}
                onChange={(e) => setAddDraft((d) => ({ ...d, name: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && void handleAdd()}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-[0.15em]" style={{ color: "var(--text-muted)" }}>Day</label>
              <select
                className="select select-bordered select-sm w-full"
                value={addDraft.day_of_week}
                onChange={(e) => setAddDraft((d) => ({ ...d, day_of_week: parseInt(e.target.value, 10) }))}
              >
                {DAYS.map((day, i) => (
                  <option key={i} value={i}>{day}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-[0.15em]" style={{ color: "var(--text-muted)" }}>Start time</label>
              <input
                type="time"
                className="input input-bordered input-sm w-full"
                value={addDraft.start_time}
                onChange={(e) => setAddDraft((d) => ({ ...d, start_time: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={() => void handleAdd()} disabled={!addDraft.name.trim() || saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Service times list */}
      {serviceTimes.length === 0 && !showAdd ? (
        <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>
          No service times yet. Add one to get started.
        </p>
      ) : (
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          {serviceTimes.map((st) => (
            <div key={st.id} className="py-3 first:pt-0 last:pb-0">
              {editingId === st.id ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    className="input input-bordered input-sm w-full"
                    value={editDraft.name}
                    onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && void handleSaveEdit()}
                    autoFocus
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase tracking-[0.15em]" style={{ color: "var(--text-muted)" }}>Day</label>
                      <select
                        className="select select-bordered select-sm w-full"
                        value={editDraft.day_of_week}
                        onChange={(e) => setEditDraft((d) => ({ ...d, day_of_week: parseInt(e.target.value, 10) }))}
                      >
                        {DAYS.map((day, i) => (
                          <option key={i} value={i}>{day}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase tracking-[0.15em]" style={{ color: "var(--text-muted)" }}>Start time</label>
                      <input
                        type="time"
                        className="input input-bordered input-sm w-full"
                        value={editDraft.start_time}
                        onChange={(e) => setEditDraft((d) => ({ ...d, start_time: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost gap-1"
                      style={{ color: "var(--success)" }}
                      onClick={() => void handleSaveEdit()}
                      disabled={saving}
                    >
                      <Check className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost gap-1"
                      style={{ color: "var(--text-muted)" }}
                      onClick={() => setEditingId(null)}
                    >
                      <X className="h-3.5 w-3.5" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {st.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {DAYS[st.day_of_week]} · {formatTime(st.start_time)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      onClick={() => startEdit(st)}
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className={`btn btn-xs ${confirmDeleteId === st.id ? "btn-error" : "btn-ghost"}`}
                      onClick={() => void handleDelete(st.id)}
                      title={confirmDeleteId === st.id ? "Click again to confirm delete" : "Delete"}
                      disabled={saving}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {confirmDeleteId === st.id && <span className="ml-1 text-xs">Confirm?</span>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
