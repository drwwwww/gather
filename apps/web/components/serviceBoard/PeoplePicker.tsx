"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Search, Sparkles, Trash2, UserMinus, X } from "lucide-react";
import Avatar from "../ui/avatar";
import { rankForRole, type ServingStats } from "../../lib/ai/autofill";
import type { BoardPerson } from "./useBoardData";
import { STATUS_WORD, type SlotStatus } from "./StatusAvatar";

export type PickerTarget = {
  /** What's being filled: "Acoustic Guitar" or a step title. */
  label: string;
  roleId: string | null;
  assignedId: string | null;
  backupId: string | null;
  status: SlotStatus;
  notes?: string;
  /** Role slots can be removed from the service; steps can't (they just lose their person). */
  removable?: boolean;
  /** Admins can confirm on someone's behalf (e.g. they said yes in the hallway). */
  canConfirm?: boolean;
};

type Row = { person: BoardPerson; fact: string; reason?: string; dim?: string };

const MENU_W = 320;

export default function PeoplePicker({
  anchor,
  target,
  people,
  stats,
  awayIds,
  busyById,
  planDate,
  onAssign,
  onBackup,
  onConfirm,
  onNotes,
  onRemoveSlot,
  onClose,
}: {
  anchor: HTMLElement;
  target: PickerTarget;
  people: BoardPerson[];
  stats: ServingStats | null;
  awayIds: Set<string>;
  /** Who already serves in this service, and as what. */
  busyById: Map<string, string>;
  planDate: string;
  onAssign: (userId: string | null) => void;
  onBackup: (userId: string | null) => void;
  onConfirm?: () => void;
  onNotes?: (notes: string) => void;
  onRemoveSlot?: () => void;
  onClose: () => void;
}) {
  // A fresh empty seat starts on "who's serving"; a filled one shows its summary first.
  const [mode, setMode] = useState<"summary" | "primary" | "backup">(target.assignedId ? "summary" : "primary");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const byId = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const assigned = target.assignedId ? byId.get(target.assignedId) : undefined;
  const backup = target.backupId ? byId.get(target.backupId) : undefined;

  useLayoutEffect(() => {
    const place = () => {
      // Assigning swaps the "+" seat for an avatar, detaching the anchor — stay put instead of jumping to 0,0.
      if (!anchor.isConnected) return;
      const r = anchor.getBoundingClientRect();
      const h = panelRef.current?.offsetHeight ?? 420;
      const left = Math.min(Math.max(8, r.left + r.width / 2 - MENU_W / 2), window.innerWidth - MENU_W - 8);
      const below = r.bottom + 8;
      const top = below + h > window.innerHeight - 8 ? Math.max(8, r.top - h - 8) : below;
      setPos({ top, left });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [anchor, mode]);

  useEffect(() => {
    if (mode !== "summary") inputRef.current?.focus();
    setQuery("");
    setActive(0);
  }, [mode]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (panelRef.current?.contains(e.target as Node) || anchor.contains(e.target as Node)) return;
      onClose();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [anchor, onClose]);

  const sections = useMemo(() => {
    const excluded = mode === "backup" ? target.assignedId : target.backupId;
    const ranked = stats
      ? rankForRole({ planDate, roleId: target.roleId, roleName: target.label, people, stats })
      : people.map((person) => ({ person, score: 0, reason: "", fact: "", outsider: person.role === "MEMBER" }));
    const q = query.trim().toLowerCase();
    const match = (p: BoardPerson) => !q || p.name.toLowerCase().includes(q) || (p.email ?? "").toLowerCase().includes(q);

    const suggested: Row[] = [];
    const available: Row[] = [];
    const others: Row[] = [];
    const cant: Row[] = [];
    for (const r of ranked) {
      const p = r.person as BoardPerson;
      if (p.id === excluded || !match(p)) continue;
      const busyAs = busyById.get(p.id);
      const isCurrent = p.id === (mode === "backup" ? target.backupId : target.assignedId);
      if (awayIds.has(p.id)) cant.push({ person: p, fact: "Away this day", dim: "away" });
      else if (busyAs && !isCurrent) cant.push({ person: p, fact: `Already on ${busyAs}`, dim: "busy" });
      else if (!r.outsider && suggested.length < 3 && !q) suggested.push({ person: p, fact: r.fact, reason: r.reason });
      else if (!r.outsider) available.push({ person: p, fact: r.fact });
      else others.push({ person: p, fact: "Member" });
    }
    available.sort((a, b) => a.person.name.localeCompare(b.person.name));
    return [
      { key: "suggested", title: "Suggested", rows: suggested },
      { key: "available", title: q ? "Matches" : "Service team", rows: available },
      { key: "others", title: "Other members", rows: others },
      { key: "cant", title: "Can't this week", rows: cant },
    ].filter((s) => s.rows.length > 0);
  }, [mode, target, stats, people, planDate, query, awayIds, busyById]);

  const flat = sections.flatMap((s) => s.rows);

  const pick = (row: Row) => {
    if (mode === "backup") {
      onBackup(row.person.id);
      onClose();
      return;
    }
    onAssign(row.person.id);
    // Second step: offer a backup, unless one is already set.
    if (target.backupId) onClose();
    else setMode("backup");
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
    if (mode === "summary") return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, flat.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && flat[active]) { e.preventDefault(); pick(flat[active]); }
  };

  if (typeof document === "undefined") return null;

  let index = -1;
  const heading =
    mode === "backup" ? `Backup for ${target.label}` : mode === "primary" ? `Who's serving · ${target.label}` : target.label;

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label={heading}
      onKeyDown={onKeyDown}
      className="fixed z-[1100] flex max-h-[min(480px,80vh)] flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_18px_40px_-12px_rgba(40,30,10,0.35)]"
      style={{ width: MENU_W, top: pos?.top ?? -9999, left: pos?.left ?? -9999 }}
    >
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] px-3 py-2.5">
        <p className="min-w-0 truncate text-xs font-semibold text-[var(--text-primary)]">{heading}</p>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {mode === "summary" && assigned ? (
        <div className="space-y-3 p-3">
          <div className="flex items-center gap-2.5">
            <Avatar name={assigned.name} email={assigned.email ?? ""} imageUrl={assigned.avatarUrl} size={36} className="bg-amber-100 text-[11px] font-bold text-amber-800" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--text-primary)]">{assigned.name}</p>
              <p className="text-xs text-[var(--text-muted)]">Serving · {STATUS_WORD[target.status]}</p>
            </div>
            <button type="button" onClick={() => setMode("primary")} className="rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]">
              Change
            </button>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-[var(--surface-2)] px-2.5 py-2">
            {backup ? (
              <>
                <Avatar name={backup.name} email={backup.email ?? ""} imageUrl={backup.avatarUrl} size={26} className="bg-emerald-100 text-[9px] font-bold text-emerald-800" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-[var(--text-primary)]">{backup.name}</p>
                  <p className="text-[11px] text-[var(--text-muted)]">Backup · steps in if they decline</p>
                </div>
                <button type="button" onClick={() => setMode("backup")} className="text-[11px] font-semibold text-amber-700 hover:text-amber-800">Change</button>
                <button type="button" onClick={() => onBackup(null)} aria-label="Remove backup" className="rounded-md p-1 text-[var(--text-muted)] hover:text-red-600">
                  <UserMinus className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <>
                <p className="flex-1 text-xs text-[var(--text-muted)]">No backup yet</p>
                <button type="button" onClick={() => setMode("backup")} className="text-[11px] font-semibold text-amber-700 hover:text-amber-800">Add a backup</button>
              </>
            )}
          </div>
          {onNotes && (
            <input
              defaultValue={target.notes ?? ""}
              onBlur={(e) => onNotes(e.target.value)}
              placeholder="Note for this spot (optional)"
              aria-label="Note"
              className="h-8 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-amber-300 focus:ring-2 focus:ring-amber-100"
            />
          )}
          <div className="flex flex-wrap gap-1.5 border-t border-[var(--border)] pt-2.5">
            {target.canConfirm && target.status === "ASSIGNED" && onConfirm && (
              <button type="button" onClick={() => { onConfirm(); onClose(); }} className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100">
                <Check className="h-3.5 w-3.5" /> Mark confirmed
              </button>
            )}
            <button type="button" onClick={() => { onAssign(null); onClose(); }} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]">
              <UserMinus className="h-3.5 w-3.5" /> Clear spot
            </button>
            {target.removable && onRemoveSlot && (
              <button type="button" onClick={() => { onRemoveSlot(); onClose(); }} className="ml-auto inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50">
                <Trash2 className="h-3.5 w-3.5" /> Remove spot
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="p-2.5 pb-1.5">
            <div className="flex h-9 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-2.5 focus-within:border-amber-300 focus-within:ring-2 focus-within:ring-amber-100">
              <Search className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" aria-hidden />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActive(0); }}
                placeholder={mode === "backup" ? "Search for a backup…" : "Search people…"}
                aria-label="Search people"
                className="h-full min-w-0 flex-1 bg-transparent text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
              />
            </div>
            {mode === "backup" && (
              <p className="mt-1.5 px-1 text-[11px] text-[var(--text-muted)]">Optional — your backup steps in automatically if the person serving declines.</p>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-1.5" role="listbox" aria-label="People">
            {sections.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-[var(--text-muted)]">No one matches “{query}”.</p>
            ) : (
              sections.map((section) => (
                <div key={section.key}>
                  <p className="mx-2 mb-1 mt-2 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    {section.key === "suggested" && <Sparkles className="h-3 w-3 text-amber-500" aria-hidden />}
                    {section.title}
                  </p>
                  {section.rows.map((row) => {
                    index += 1;
                    const i = index;
                    const current = row.person.id === (mode === "backup" ? target.backupId : target.assignedId);
                    return (
                      <button
                        key={`${section.key}-${row.person.id}`}
                        type="button"
                        role="option"
                        aria-selected={i === active}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => pick(row)}
                        title={row.reason}
                        className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors ${i === active ? "bg-amber-50/80" : ""} ${row.dim ? "opacity-55" : ""}`}
                      >
                        <Avatar name={row.person.name} email={row.person.email ?? ""} imageUrl={row.person.avatarUrl} size={26} className="bg-amber-100 text-[9px] font-bold text-amber-800" />
                        <span className="min-w-0 flex-1 truncate text-xs font-medium text-[var(--text-primary)]">{row.person.name}</span>
                        {current ? (
                          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-label="Current" />
                        ) : (
                          <span className="max-w-[120px] shrink-0 truncate text-right text-[10.5px] text-[var(--text-muted)]">{row.fact}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
          <div className="flex items-center justify-between border-t border-[var(--border)] px-3 py-2 text-[10.5px] text-[var(--text-muted)]">
            {mode === "backup" ? (
              <button type="button" onClick={onClose} className="font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                {target.backupId ? "Done" : "Skip — no backup"}
              </button>
            ) : (
              <span>Then you can add a backup</span>
            )}
            <span className="flex gap-1">
              <kbd className="rounded border border-[var(--border)] bg-[var(--surface-2)] px-1">↑↓</kbd>
              <kbd className="rounded border border-[var(--border)] bg-[var(--surface-2)] px-1">Enter</kbd>
            </span>
          </div>
        </>
      )}
    </div>,
    document.body
  );
}
