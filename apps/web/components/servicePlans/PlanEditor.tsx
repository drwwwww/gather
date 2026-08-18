"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { List, ChevronDown } from "lucide-react";
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
  lastSaved?: Date | null;
  error?: string | null;
};

const statusOptions: ServicePlanStatus[] = ["PLANNED", "DONE", "SKIPPED"];

function useDropdownAnchor() {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ left: number; top: number; width: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setAnchor({ left: r.left, top: r.bottom + 4, width: r.width });
    }
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node) || listRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return { open, setOpen, anchor, btnRef, listRef, toggle };
}

function StatusSelect({ value, onChange }: { value: ServicePlanStatus; onChange: (v: ServicePlanStatus) => void }) {
  const { open, setOpen, anchor, btnRef, listRef, toggle } = useDropdownAnchor();
  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className="mt-1 flex h-10 w-full items-center justify-between rounded-lg border px-3 text-sm transition-colors hover:border-amber-400"
        style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text-primary)" }}
      >
        <span>{value}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: "var(--text-muted)" }} />
      </button>
      {open && anchor && typeof document !== "undefined" && createPortal(
        <div
          ref={listRef}
          style={{ position: "fixed", left: anchor.left, top: anchor.top, width: Math.max(anchor.width, 140), borderColor: "var(--border)", background: "var(--surface)" } as React.CSSProperties}
          className="z-[1001] overflow-hidden rounded-xl border shadow-lg"
        >
          {statusOptions.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => { onChange(status); setOpen(false); }}
              className={`block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-amber-50 hover:text-amber-800 ${value === status ? "font-semibold text-amber-600" : ""}`}
              style={value === status ? {} : { color: "var(--text-primary)" }}
            >
              {status}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

function MemberSelect({ value, members, onChange }: { value: string | null; members: MemberOption[]; onChange: (v: string | null) => void }) {
  const { open, setOpen, anchor, btnRef, listRef, toggle } = useDropdownAnchor();
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const label = (id: string | null) => {
    if (!id) return "— Open —";
    const m = members.find((mm) => mm.id === id);
    return m?.full_name?.trim() || m?.email || "— Open —";
  };

  const filtered = search
    ? members.filter((m) => (m.full_name?.toLowerCase().includes(search.toLowerCase()) || m.email?.toLowerCase().includes(search.toLowerCase())))
    : members;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => { toggle(); setSearch(""); setTimeout(() => searchRef.current?.focus(), 0); }}
        className="mt-1 flex h-10 w-full items-center justify-between rounded-lg border px-3 text-sm transition-colors hover:border-amber-400"
        style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text-primary)" }}
      >
        <span className="truncate">{label(value)}</span>
        <ChevronDown className={`ml-1 h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: "var(--text-muted)" }} />
      </button>
      {open && anchor && typeof document !== "undefined" && createPortal(
        <div
          ref={listRef}
          style={{ position: "fixed", left: anchor.left, top: anchor.top, width: Math.max(anchor.width, 240), borderColor: "var(--border)", background: "var(--surface)" } as React.CSSProperties}
          className="z-[1001] overflow-hidden rounded-xl border shadow-lg"
        >
          <div className="border-b px-3 py-2" style={{ borderColor: "var(--border)" }}>
            <input
              ref={searchRef}
              type="text"
              placeholder="Search members…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm outline-none"
              style={{ color: "var(--text-primary)" }}
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => { onChange(null); setOpen(false); }}
              className={`block w-full px-3 py-2 text-left text-sm italic transition-colors hover:bg-amber-50 hover:text-amber-800 ${!value ? "font-semibold text-amber-600" : ""}`}
              style={!value ? {} : { color: "var(--text-muted)" }}
            >
              — Open —
            </button>
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-sm" style={{ color: "var(--text-muted)" }}>No matches</p>
            )}
            {filtered.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => { onChange(m.id); setOpen(false); }}
                className={`block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-amber-50 hover:text-amber-800 ${value === m.id ? "font-semibold text-amber-600" : ""}`}
                style={value === m.id ? {} : { color: "var(--text-primary)" }}
              >
                {m.full_name?.trim() || m.email || m.id.slice(0, 8)}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

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
  lastSaved,
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
              {saving ? "Saving…" : "Save plan"}
            </button>
            {saving && <p className="text-xs text-[var(--text-muted)]">Saving…</p>}
            {!saving && lastSaved && (
              <p className="text-xs text-[var(--text-muted)]">
                Saved {lastSaved.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </p>
            )}
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
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
                  <StatusSelect
                    value={item.status}
                    onChange={(status) => handleItemChange(item.id, { status })}
                  />
                </div>
                {members.length > 0 ? (
                  <div className="mt-3">
                    <label className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                      Assigned person
                    </label>
                    <MemberSelect
                      value={item.assigned_user_id}
                      members={members}
                      onChange={(id) => handleItemChange(item.id, { assigned_user_id: id })}
                    />
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
