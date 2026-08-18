"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import Link from "next/link";
import { Users, Calendar, RefreshCw, ClipboardList, ChevronDown, Trash2, StickyNote, Search, X, CheckCircle, UserPlus, RotateCcw } from "lucide-react";
import { Button } from "../ui/button";

type ProfileRow = { id: string; full_name: string | null; email: string | null; role: string; disabled: boolean };
type AssignmentStatus = "OPEN" | "ASSIGNED" | "CONFIRMED" | "DECLINED";

export type BulletinSlotRow = {
  id: string;
  role_id: string;
  role_name: string;
  assigned_user_id: string | null;
  backup_user_id: string | null;
  status: AssignmentStatus;
  notes: string | null;
};

export type BulletinItemRow = {
  id: string;
  title: string;
  assigned_user_id: string | null;
  backup_user_id: string | null;
  status: AssignmentStatus;
  notes: string | null;
};

type AssignmentsTableProps = {
  profiles: ProfileRow[];
  showOpenOnly: boolean;
  showPendingOnly: boolean;
  showDeclinedOnly: boolean;
  searchTerm: string;
  onToggleOpenOnly: (value: boolean) => void;
  onTogglePendingOnly: (value: boolean) => void;
  onToggleDeclinedOnly: (value: boolean) => void;
  onSearchChange: (value: string) => void;
  onGenerateSchedule: () => void;
  onCopyLast: () => void;
  onRefresh?: () => void;
  bulletinPlanTitle?: string | null;
  bulletinPlanHref?: string | null;
  bulletinSlots?: BulletinSlotRow[];
  onBulletinSlotUpdate?: (slotId: string, patch: {
    assigned_user_id?: string | null;
    backup_user_id?: string | null;
    status?: AssignmentStatus;
    notes?: string | null;
  }) => void;
  onBulletinSlotDelete?: (slotId: string) => void;
  bulletinItems?: BulletinItemRow[];
  onBulletinItemUpdate?: (itemId: string, patch: {
    assigned_user_id?: string | null;
    backup_user_id?: string | null;
    status?: AssignmentStatus;
    notes?: string | null;
  }) => void;
};

const STATUS_META: Record<AssignmentStatus, { label: string; bar: string; badge: string }> = {
  OPEN:      { label: "Open",      bar: "bg-amber-400",   badge: "bg-amber-50  text-amber-700  ring-amber-200"  },
  ASSIGNED:  { label: "Pending",   bar: "bg-slate-300",   badge: "bg-slate-100 text-slate-600  ring-slate-200"  },
  CONFIRMED: { label: "Confirmed", bar: "bg-emerald-400", badge: "bg-green-50  text-green-700  ring-green-200"  },
  DECLINED:  { label: "Declined",  bar: "bg-red-400",     badge: "bg-red-50    text-red-600    ring-red-200"    },
};

type StatusFilter = "ALL" | AssignmentStatus;
type UnifiedRow = { kind: "bulletin"; data: BulletinSlotRow } | { kind: "item"; data: BulletinItemRow };

function initials(p: ProfileRow | undefined) {
  if (!p) return "?";
  const n = p.full_name?.trim();
  if (n) {
    const parts = n.split(/\s+/);
    return parts.length >= 2 ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() : n.slice(0, 2).toUpperCase();
  }
  return (p.email?.slice(0, 2) ?? "??").toUpperCase();
}

function Avatar({ profile, size = "md" }: { profile: ProfileRow | undefined; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "h-6 w-6 text-[9px]" : "h-8 w-8 text-[11px]";
  const bg = profile ? "bg-amber-100 text-amber-700" : "bg-[var(--surface-2)] text-[var(--text-muted)]";
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full font-bold ${sz} ${bg}`}>
      {profile ? initials(profile) : "—"}
    </span>
  );
}

const FILTER_TABS: { label: string; value: StatusFilter }[] = [
  { label: "All",       value: "ALL"       },
  { label: "Open",      value: "OPEN"      },
  { label: "Pending",   value: "ASSIGNED"  },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Declined",  value: "DECLINED"  },
];

const STATUS_OPTIONS = [
  { value: "OPEN",      label: "Open"      },
  { value: "ASSIGNED",  label: "Pending"   },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "DECLINED",  label: "Declined"  },
];

function StatusDropdown({
  status,
  onChange,
}: {
  status: AssignmentStatus;
  onChange: (s: AssignmentStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const meta = STATUS_META[status];

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset transition-colors ${meta.badge} hover:opacity-80`}
      >
        {meta.label}
        <ChevronDown className={`h-3 w-3 opacity-60 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul className="absolute right-0 top-full z-50 mt-1.5 min-w-[130px] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-lg">
          {STATUS_OPTIONS.map((opt) => {
            const m = STATUS_META[opt.value as AssignmentStatus];
            const isSelected = opt.value === status;
            return (
              <li key={opt.value} className="list-none">
                <button
                  type="button"
                  onClick={() => { onChange(opt.value as AssignmentStatus); setOpen(false); }}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--surface-2)] ${isSelected ? "font-semibold" : ""}`}
                >
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${m.badge}`}>
                    {opt.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Ghost select overlay — shows visible text + chevron, invisible native select on top for interaction */
function AssigneeCell({
  profile,
  options,
  value,
  onChange,
  placeholder = "Unassigned",
}: {
  profile: ProfileRow | undefined;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="group/assignee flex items-center gap-2.5">
      <Avatar profile={profile} />
      <div className="relative flex min-w-0 flex-1 items-center gap-1 rounded-lg px-1 py-0.5 transition-colors group-hover/assignee:bg-[var(--surface-2)]">
        <span className={`min-w-0 flex-1 truncate text-sm font-medium ${profile ? "text-[var(--text-primary)]" : "text-[var(--text-muted)] italic"}`}>
          {profile?.full_name || profile?.email || placeholder}
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)] opacity-0 transition-opacity group-hover/assignee:opacity-100" />
        <select
          className="absolute inset-0 w-full cursor-pointer opacity-0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Unassigned</option>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    </div>
  );
}

export default function AssignmentsTable({
  profiles, showOpenOnly, showPendingOnly, showDeclinedOnly, searchTerm,
  onToggleOpenOnly, onTogglePendingOnly, onToggleDeclinedOnly, onSearchChange,
  onGenerateSchedule, onCopyLast, bulletinPlanTitle = null, bulletinPlanHref = null,
  bulletinSlots = [], onBulletinSlotUpdate, onBulletinSlotDelete,
  bulletinItems = [], onBulletinItemUpdate, onRefresh,
}: AssignmentsTableProps) {
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [openNotes, setOpenNotes] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const serviceProfiles = useMemo(() => profiles.filter((p) => p.role === "SERVICE" || p.role === "ADMIN"), [profiles]);
  const profileById = useMemo(() => Object.fromEntries(profiles.map((p) => [p.id, p])), [profiles]);
  const personOptions = useMemo(() => serviceProfiles.map((p) => ({ value: p.id, label: p.full_name || p.email || p.id })), [serviceProfiles]);

  const activeFilter: StatusFilter = showOpenOnly ? "OPEN" : showPendingOnly ? "ASSIGNED" : showDeclinedOnly ? "DECLINED" : statusFilter;

  const setFilter = (f: StatusFilter) => {
    setStatusFilter(f);
    onToggleOpenOnly(f === "OPEN");
    onTogglePendingOnly(f === "ASSIGNED");
    onToggleDeclinedOnly(f === "DECLINED");
  };

  const toggleNote = (id: string) => setOpenNotes((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const unified = useMemo<UnifiedRow[]>(() => {
    const term = searchTerm.trim().toLowerCase();
    const byStatus = (s: AssignmentStatus) => activeFilter === "ALL" || activeFilter === s;
    const slotRows = bulletinSlots
      .filter((s) => byStatus(s.status) && (!term || `${s.role_name} ${profileById[s.assigned_user_id ?? ""]?.full_name ?? ""}`.toLowerCase().includes(term)))
      .map((s) => ({ kind: "bulletin" as const, data: s }));
    const itemRows = bulletinItems
      .filter((i) => byStatus(i.status) && (!term || `${i.title} ${profileById[i.assigned_user_id ?? ""]?.full_name ?? ""}`.toLowerCase().includes(term)))
      .map((i) => ({ kind: "item" as const, data: i }));
    return [...slotRows, ...itemRows];
  }, [bulletinSlots, bulletinItems, activeFilter, searchTerm, profileById]);

  // Progress stats
  const total = bulletinSlots.length + bulletinItems.length;
  const confirmed = [...bulletinSlots, ...bulletinItems].filter((r) => r.status === "CONFIRMED").length;
  const confirmedPct = total > 0 ? Math.round((confirmed / total) * 100) : 0;

  const isEmpty = unified.length === 0;
  const hasNoData = bulletinSlots.length === 0 && bulletinItems.length === 0;

  // Split display into role slots vs run-of-show items
  const displaySlots = unified.filter((r) => r.kind === "bulletin");
  const displayItems = unified.filter((r) => r.kind === "item");

  const update = (row: UnifiedRow, patch: Parameters<NonNullable<typeof onBulletinSlotUpdate>>[1]) =>
    row.kind === "bulletin"
      ? onBulletinSlotUpdate?.(row.data.id, patch)
      : onBulletinItemUpdate?.(row.data.id, patch);

  function renderRow(row: UnifiedRow) {
    const core = row.data;
    const id = row.kind === "bulletin" ? `b-${core.id}` : `i-${core.id}`;
    const roleName = "role_name" in core ? core.role_name : core.title;
    const assignedId = core.assigned_user_id ?? "";
    const backupId   = core.backup_user_id ?? "";
    const meta = STATUS_META[core.status];
    const assignedProfile = assignedId ? profileById[assignedId] : undefined;
    const backupProfile   = backupId   ? profileById[backupId]   : undefined;
    const backupOptions   = personOptions.filter((o) => o.value !== assignedId);
    const noteValue = notesDraft[id] ?? core.notes ?? "";
    const noteIsOpen = openNotes.has(id);
    const hasNote = noteValue.trim().length > 0;

    return (
      <div key={id} className="group relative border-b border-[var(--border)] last:border-0">
        {/* Status left bar */}
        <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${meta.bar} opacity-70`} />

        {/* Main row */}
        <div className="flex items-center gap-4 py-4 pl-6 pr-4">
          {/* Role + optional note */}
          <div className="w-40 shrink-0">
            <p className="text-sm font-semibold text-[var(--text-primary)]">{roleName}</p>
            {hasNote && !noteIsOpen && (
              <p className="mt-0.5 truncate text-[11px] text-[var(--text-muted)]" title={noteValue}>
                📝 {noteValue}
              </p>
            )}
          </div>

          {/* Assignee */}
          <div className="min-w-0 flex-1">
            <AssigneeCell
              profile={assignedProfile}
              options={personOptions}
              value={assignedId}
              onChange={(v) => update(row, { assigned_user_id: v || null })}
            />
          </div>

          {/* Context-aware action + status badge */}
          <div className="flex shrink-0 items-center gap-2">
            {core.status === "ASSIGNED" && (
              <button
                type="button"
                onClick={() => update(row, { status: "CONFIRMED" })}
                className="flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 transition-colors hover:bg-green-100 focus:outline-none"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Confirm
              </button>
            )}
            {core.status === "OPEN" && (
              <span className="text-xs text-[var(--text-muted)] italic">
                {assignedId ? "" : "Unassigned"}
              </span>
            )}
            {core.status === "DECLINED" && (
              <button
                type="button"
                onClick={() => update(row, { assigned_user_id: null, status: "OPEN" })}
                className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100 focus:outline-none"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reassign
              </button>
            )}

            {/* Status — custom dropdown */}
            <StatusDropdown
              status={core.status}
              onChange={(s) => update(row, { status: s })}
            />

            {/* Row actions */}
            <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={() => toggleNote(id)}
                title="Note"
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-2)] ${noteIsOpen || hasNote ? "text-amber-500" : "text-[var(--text-muted)]"}`}
              >
                <StickyNote className="h-3.5 w-3.5" />
              </button>
              {row.kind === "bulletin" && (
                <button
                  type="button"
                  onClick={() => onBulletinSlotDelete?.(core.id)}
                  title="Remove slot"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Backup selector — smooth reveal on row hover */}
        <div className="overflow-hidden max-h-0 group-hover:max-h-12 transition-[max-height] duration-200 ease-out pl-6 pr-4">
          <div className="flex items-center gap-2 pb-3 pl-[168px]">
            <Users className="h-3.5 w-3.5 text-[var(--text-muted)]" />
            <span className="text-[11px] text-[var(--text-muted)]">Backup:</span>
            <div className="group/backup relative inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 transition-colors hover:bg-[var(--surface-2)]">
              <Avatar profile={backupProfile} size="sm" />
              <span className={`text-[11px] font-medium ${backupProfile ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)] italic"}`}>
                {backupProfile?.full_name || backupProfile?.email || "None"}
              </span>
              <ChevronDown className="h-3 w-3 shrink-0 text-[var(--text-muted)] opacity-0 transition-opacity duration-100 group-hover/backup:opacity-100" />
              <select
                className="absolute inset-0 w-full cursor-pointer opacity-0"
                value={backupId}
                onChange={(e) => update(row, { backup_user_id: e.target.value || null })}
              >
                <option value="">None</option>
                {backupOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Inline note editor */}
        {noteIsOpen && (
          <div className="border-t border-[var(--border)] bg-[var(--surface-container-low)] px-6 py-3">
            <input
              type="text"
              autoFocus
              placeholder="Add a note for this assignment…"
              value={noteValue}
              onChange={(e) => setNotesDraft((prev) => ({ ...prev, [id]: e.target.value }))}
              onBlur={(e) => update(row, { notes: e.target.value.trim() || null })}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm placeholder:text-[var(--text-muted)] focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="stitch-section-card space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="stitch-icon-well" aria-hidden><ClipboardList className="h-6 w-6" strokeWidth={2} /></div>
          <div>
            <h2 className="m-0 text-lg font-semibold tracking-tight text-[var(--text-primary)]">Assignments</h2>
            {bulletinPlanTitle && (
              <p className="mt-0.5 text-sm text-[var(--text-muted)]">Plan: {bulletinPlanTitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {bulletinPlanHref && (
            <Link href={bulletinPlanHref} className="text-sm font-semibold text-amber-500 transition-colors hover:text-amber-700 no-underline">
              View plan
            </Link>
          )}
          {onRefresh && (
            <button type="button" onClick={onRefresh} className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]">
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)]">{confirmed} of {total} confirmed</span>
            <span className="font-semibold text-[var(--text-primary)]">{confirmedPct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all duration-500 ease-out"
              style={{ width: `${confirmedPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Filters + search */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-1">
          {FILTER_TABS.map(({ label, value }) => {
            const count = value === "ALL"
              ? unified.length
              : unified.filter((r) => r.data.status === value).length;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${activeFilter === value ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
              >
                {label}
                {count > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums ${activeFilter === value ? "bg-amber-100 text-amber-700" : "bg-[var(--surface)] text-[var(--text-muted)]"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="relative ml-auto flex items-center">
          <Search className="absolute left-2.5 h-3.5 w-3.5 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search…"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 w-44 rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-8 pr-8 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100"
          />
          {searchTerm && (
            <button type="button" onClick={() => onSearchChange("")} className="absolute right-2.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* No team warning */}
      {serviceProfiles.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[var(--border)] px-6 py-8 text-center">
          <Users className="h-7 w-7 text-[var(--text-muted)]" />
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">No service team members yet</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Add volunteers to start scheduling.</p>
          </div>
          <Link href="/people"><Button variant="secondary" size="sm">Add volunteers</Button></Link>
        </div>
      )}

      {/* Row list */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        {isEmpty ? (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <Calendar className="h-8 w-8 text-[var(--text-muted)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {hasNoData ? "No assignments yet" : "No results match your filters"}
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {hasNoData ? "Generate a schedule or copy the last service to get started." : "Try adjusting your search or filter."}
              </p>
            </div>
            {hasNoData && (
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={onGenerateSchedule}>Generate schedule</Button>
                <Button variant="secondary" size="sm" onClick={onCopyLast}>Copy last service</Button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Role slots section */}
            {displaySlots.length > 0 && (
              <>
                {displayItems.length > 0 && (
                  <div className="border-b border-[var(--border)] bg-[var(--surface-container-low)] px-6 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Role Slots</p>
                  </div>
                )}
                {displaySlots.map(renderRow)}
              </>
            )}

            {/* Run-of-show items section */}
            {displayItems.length > 0 && (
              <>
                <div className="border-b border-[var(--border)] bg-[var(--surface-container-low)] px-6 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Run of Show</p>
                </div>
                {displayItems.map(renderRow)}
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}
