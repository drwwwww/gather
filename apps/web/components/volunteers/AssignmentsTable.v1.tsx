"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Users, Calendar, RefreshCw, ClipboardList, ChevronDown, Trash2, StickyNote } from "lucide-react";
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

const STATUS_META: Record<AssignmentStatus, { label: string; bar: string; text: string; bg: string }> = {
  OPEN:      { label: "Open",      bar: "bg-amber-400",   text: "text-amber-700",  bg: "bg-amber-50"  },
  ASSIGNED:  { label: "Pending",   bar: "bg-slate-400",   text: "text-slate-600",  bg: "bg-slate-100" },
  CONFIRMED: { label: "Confirmed", bar: "bg-emerald-400", text: "text-emerald-700",bg: "bg-emerald-50"},
  DECLINED:  { label: "Declined",  bar: "bg-red-400",     text: "text-red-700",    bg: "bg-red-50"    },
};

type StatusFilter = "ALL" | AssignmentStatus;

function initials(profile: ProfileRow | undefined): string {
  if (!profile) return "?";
  const name = profile.full_name?.trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  return (profile.email?.slice(0, 2) ?? "??").toUpperCase();
}

function Avatar({ profile }: { profile: ProfileRow | undefined }) {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700">
      {profile ? initials(profile) : "—"}
    </span>
  );
}

function GhostSelect({
  value,
  options,
  placeholder,
  onChange,
  faded,
  className = "",
}: {
  value: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  onChange: (v: string) => void;
  faded?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative flex min-w-0 items-center ${className}`}>
      <select
        className="w-full min-w-0 appearance-none truncate bg-transparent pr-5 text-sm cursor-pointer focus:outline-none"
        style={{ color: faded ? "var(--text-muted)" : "var(--text-primary)" }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-0 h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
    </div>
  );
}

type UnifiedRow =
  | { kind: "bulletin"; data: BulletinSlotRow }
  | { kind: "item"; data: BulletinItemRow };

export default function AssignmentsTable({
  profiles,
  showOpenOnly,
  showPendingOnly,
  showDeclinedOnly,
  searchTerm,
  onToggleOpenOnly,
  onTogglePendingOnly,
  onToggleDeclinedOnly,
  onSearchChange,
  onGenerateSchedule,
  onCopyLast,
  bulletinPlanTitle = null,
  bulletinPlanHref = null,
  bulletinSlots = [],
  onBulletinSlotUpdate,
  onBulletinSlotDelete,
  bulletinItems = [],
  onBulletinItemUpdate,
  onRefresh,
}: AssignmentsTableProps) {
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const serviceProfiles = useMemo(
    () => (Array.isArray(profiles) ? profiles : []).filter((p) => p.role === "SERVICE" || p.role === "ADMIN"),
    [profiles]
  );

  const profileById = useMemo(
    () => Object.fromEntries(profiles.map((p) => [p.id, p])),
    [profiles]
  );

  const personOptions = useMemo(
    () => serviceProfiles.map((p) => ({ value: p.id, label: p.full_name || p.email || p.id })),
    [serviceProfiles]
  );

  const statusOptions = [
    { value: "OPEN",      label: "Open"      },
    { value: "ASSIGNED",  label: "Pending"   },
    { value: "CONFIRMED", label: "Confirmed" },
    { value: "DECLINED",  label: "Declined"  },
  ];

  // Sync external filter state → internal status filter pill
  const activeStatusFilter: StatusFilter =
    showOpenOnly ? "OPEN" : showPendingOnly ? "ASSIGNED" : showDeclinedOnly ? "DECLINED" : statusFilter;

  const setFilter = (f: StatusFilter) => {
    setStatusFilter(f);
    onToggleOpenOnly(f === "OPEN");
    onTogglePendingOnly(f === "ASSIGNED");
    onToggleDeclinedOnly(f === "DECLINED");
  };

  const unified = useMemo<UnifiedRow[]>(() => {
    const term = searchTerm.trim().toLowerCase();
    const byStatus = (s: AssignmentStatus) =>
      activeStatusFilter === "ALL" || activeStatusFilter === s;

    const slotRows: UnifiedRow[] = bulletinSlots
      .filter((s) => {
        if (!byStatus(s.status)) return false;
        if (!term) return true;
        const ap = profiles.find((p) => p.id === s.assigned_user_id);
        const bp = profiles.find((p) => p.id === s.backup_user_id);
        return `${s.role_name} ${ap?.full_name ?? ""} ${bp?.full_name ?? ""}`.toLowerCase().includes(term);
      })
      .map((s) => ({ kind: "bulletin" as const, data: s }));

    const itemRows: UnifiedRow[] = bulletinItems
      .filter((item) => {
        if (!byStatus(item.status)) return false;
        if (!term) return true;
        const ap = profiles.find((p) => p.id === item.assigned_user_id);
        const bp = profiles.find((p) => p.id === item.backup_user_id);
        return `${item.title} ${ap?.full_name ?? ""} ${bp?.full_name ?? ""}`.toLowerCase().includes(term);
      })
      .map((item) => ({ kind: "item" as const, data: item }));

    return [...slotRows, ...itemRows];
  }, [bulletinSlots, bulletinItems, activeStatusFilter, searchTerm, profiles]);

  const isEmpty = unified.length === 0;
  const hasNoData = bulletinSlots.length === 0 && bulletinItems.length === 0;

  const FILTER_PILLS: { label: string; value: StatusFilter }[] = [
    { label: "All",       value: "ALL"       },
    { label: "Open",      value: "OPEN"      },
    { label: "Pending",   value: "ASSIGNED"  },
    { label: "Confirmed", value: "CONFIRMED" },
    { label: "Declined",  value: "DECLINED"  },
  ];

  return (
    <section className="stitch-section-card space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="stitch-icon-well" aria-hidden>
            <ClipboardList className="h-6 w-6" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h2 className="m-0 text-lg font-semibold tracking-tight text-[var(--text-primary)]">Assignments</h2>
            {bulletinPlanTitle && (
              <p className="mt-0.5 text-sm text-[var(--text-muted)]">Plan: {bulletinPlanTitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {bulletinPlanHref && (
            <Link
              href={bulletinPlanHref}
              className="text-sm font-semibold text-[#f59e0b] no-underline transition-colors hover:text-amber-700 hover:underline"
            >
              View plan
            </Link>
          )}
          {onRefresh && (
            <button
              type="button"
              className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
              onClick={onRefresh}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTER_PILLS.map(({ label, value }) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`btn btn-sm ${activeStatusFilter === value ? "btn-primary-gradient" : "btn-secondary"}`}
          >
            {label}
          </button>
        ))}
        <input
          type="text"
          className="input input-bordered input-sm ml-auto w-full max-w-[220px]"
          placeholder="Search…"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* No service team warning */}
      {serviceProfiles.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[var(--border)] px-6 py-8 text-center">
          <Users className="h-7 w-7 text-[var(--text-muted)]" />
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">No service team members yet</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Add volunteers to start scheduling.</p>
          </div>
          <Link href="/people">
            <Button variant="secondary" size="sm">Add volunteers</Button>
          </Link>
        </div>
      )}

      {/* Row list */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        {isEmpty ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <Calendar className="h-8 w-8 text-[var(--text-muted)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {hasNoData ? "No assignments yet" : "No results match your filters"}
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {hasNoData
                  ? "Generate a schedule or copy the last service to get started."
                  : "Try adjusting your search or filter."}
              </p>
            </div>
            {hasNoData && (
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="primary" size="sm" onClick={onGenerateSchedule}>Generate schedule</Button>
                <Button variant="secondary" size="sm" onClick={onCopyLast}>Copy last service</Button>
              </div>
            )}
          </div>
        ) : (
          unified.map((row, idx) => {
            const isLast = idx === unified.length - 1;
            const core = row.data;
            const id = row.kind === "bulletin" ? `b-${core.id}` : `i-${core.id}`;
            const roleName = "role_name" in core ? core.role_name : core.title;
            const assignedId = core.assigned_user_id ?? "";
            const backupId   = core.backup_user_id ?? "";
            const status     = core.status;
            const meta       = STATUS_META[status];
            const noteValue  = notesDraft[id] ?? core.notes ?? "";
            const noteOpen   = expandedNotes.has(id);

            const assignedProfile = assignedId ? profileById[assignedId] : undefined;
            const backupProfile   = backupId   ? profileById[backupId]   : undefined;

            const toggleNote = () =>
              setExpandedNotes((prev) => {
                const next = new Set(prev);
                next.has(id) ? next.delete(id) : next.add(id);
                return next;
              });

            const backupOptions = personOptions.filter((o) => o.value !== assignedId);

            return (
              <div
                key={id}
                className={`group relative flex flex-col ${isLast ? "" : "border-b border-[var(--border)]"}`}
              >
                {/* Status bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl ${meta.bar}`} aria-hidden />

                {/* Main row */}
                <div className="grid grid-cols-[9rem_1fr_auto_auto] items-center gap-x-6 pl-5 pr-4 py-4">
                  {/* Role name */}
                  <p className="truncate text-sm font-semibold text-[var(--text-primary)]" title={roleName}>
                    {roleName}
                  </p>

                  {/* Assignee + Backup stacked */}
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar profile={assignedProfile} />
                    <div className="min-w-0 flex-1">
                      <GhostSelect
                        value={assignedId}
                        options={personOptions}
                        placeholder="Unassigned"
                        faded={!assignedId}
                        className="max-w-[160px]"
                        onChange={(v) =>
                          row.kind === "bulletin"
                            ? onBulletinSlotUpdate?.(core.id, { assigned_user_id: v || null })
                            : onBulletinItemUpdate?.(core.id, { assigned_user_id: v || null })
                        }
                      />
                      <div className="mt-0.5 flex items-center gap-1">
                        <span className="text-[11px] text-[var(--text-muted)]">Backup:</span>
                        <GhostSelect
                          value={backupId}
                          options={backupOptions}
                          placeholder="None"
                          faded
                          className="max-w-[120px]"
                          onChange={(v) =>
                            row.kind === "bulletin"
                              ? onBulletinSlotUpdate?.(core.id, { backup_user_id: v || null })
                              : onBulletinItemUpdate?.(core.id, { backup_user_id: v || null })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status pill select */}
                  <div className={`relative flex items-center rounded-full px-3 py-1 ${meta.bg}`}>
                    <select
                      className={`appearance-none bg-transparent pr-4 text-xs font-semibold cursor-pointer focus:outline-none ${meta.text}`}
                      value={status}
                      onChange={(e) =>
                        row.kind === "bulletin"
                          ? onBulletinSlotUpdate?.(core.id, { status: e.target.value as AssignmentStatus })
                          : onBulletinItemUpdate?.(core.id, { status: e.target.value as AssignmentStatus })
                      }
                    >
                      {statusOptions.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <ChevronDown className={`pointer-events-none absolute right-2 h-3 w-3 ${meta.text}`} />
                  </div>

                  {/* Hover actions */}
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={toggleNote}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-2)] ${noteOpen ? "text-amber-500" : "text-[var(--text-muted)]"}`}
                      title="Notes"
                    >
                      <StickyNote className="h-4 w-4" />
                    </button>
                    {row.kind === "bulletin" && (
                      <button
                        type="button"
                        onClick={() => onBulletinSlotDelete?.(core.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-red-50 hover:text-red-500"
                        title="Delete slot"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expandable notes */}
                {noteOpen && (
                  <div className="px-5 pb-4 pl-8">
                    <input
                      type="text"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm placeholder:text-[var(--text-muted)] focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100"
                      placeholder="Add a note…"
                      value={noteValue}
                      onChange={(e) => setNotesDraft((prev) => ({ ...prev, [id]: e.target.value }))}
                      onBlur={(e) =>
                        row.kind === "bulletin"
                          ? onBulletinSlotUpdate?.(core.id, { notes: e.target.value.trim() || null })
                          : onBulletinItemUpdate?.(core.id, { notes: e.target.value.trim() })
                      }
                      autoFocus
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
