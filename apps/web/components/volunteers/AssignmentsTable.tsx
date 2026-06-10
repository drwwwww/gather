"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Users, Calendar, RefreshCw, ClipboardList } from "lucide-react";

import { Button } from "../ui/button";
import Badge from "../ui/Badge";

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
  /** Step title used as the "role" label, e.g. "Closing Prayer" */
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
  // Bulletin role slots from the linked service plan
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
  // Run-of-show items with an assigned person
  bulletinItems?: BulletinItemRow[];
  onBulletinItemUpdate?: (itemId: string, patch: {
    assigned_user_id?: string | null;
    backup_user_id?: string | null;
    status?: AssignmentStatus;
    notes?: string | null;
  }) => void;
};

const statusStyles: Record<AssignmentStatus, { label: string; variant: "warning" | "neutral" | "success" | "danger" }> = {
  OPEN: { label: "OPEN", variant: "warning" },
  ASSIGNED: { label: "PENDING", variant: "neutral" },
  CONFIRMED: { label: "CONFIRMED", variant: "success" },
  DECLINED: { label: "DECLINED", variant: "danger" }
};

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

  const serviceProfiles = useMemo(
    () => (Array.isArray(profiles) ? profiles : []).filter((p) => p.role === "SERVICE" || p.role === "ADMIN"),
    [profiles]
  );

  const statusFilters = useMemo<AssignmentStatus[]>(() => {
    const f: AssignmentStatus[] = [];
    if (showOpenOnly) f.push("OPEN");
    if (showPendingOnly) f.push("ASSIGNED");
    if (showDeclinedOnly) f.push("DECLINED");
    return f;
  }, [showOpenOnly, showPendingOnly, showDeclinedOnly]);

  const unified = useMemo<UnifiedRow[]>(() => {
    const term = searchTerm.trim().toLowerCase();

    const bulletinRows: UnifiedRow[] = bulletinSlots
      .filter((s) => {
        if (statusFilters.length && !statusFilters.includes(s.status)) return false;
        if (!term) return true;
        const assignedProfile = profiles.find((p) => p.id === s.assigned_user_id);
        const backupProfile = profiles.find((p) => p.id === s.backup_user_id);
        const names = [assignedProfile, backupProfile].filter(Boolean).map((p) => p?.full_name || p?.email || "").join(" ");
        return `${s.role_name} ${names}`.toLowerCase().includes(term);
      })
      .map((s) => ({ kind: "bulletin" as const, data: s }));

    // Run-of-show items with an assigned person (only show those with someone assigned)
    const itemRows: UnifiedRow[] = bulletinItems
      .filter((item) => {
        if (statusFilters.length && !statusFilters.includes(item.status)) return false;
        if (!term) return true;
        const assignedProfile = profiles.find((p) => p.id === item.assigned_user_id);
        const backupProfile = profiles.find((p) => p.id === item.backup_user_id);
        const names = [assignedProfile, backupProfile].filter(Boolean).map((p) => p?.full_name || p?.email || "").join(" ");
        return `${item.title} ${names}`.toLowerCase().includes(term);
      })
      .map((item) => ({ kind: "item" as const, data: item }));

    return [...bulletinRows, ...itemRows];
  }, [bulletinSlots, bulletinItems, statusFilters, searchTerm, profiles]);

  const isEmpty = unified.length === 0;
  const hasNoData = bulletinSlots.length === 0 && bulletinItems.length === 0;

  return (
    <section className="stitch-section-card space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="stitch-icon-well" aria-hidden>
            <ClipboardList className="h-6 w-6" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h2 className="m-0 text-lg font-semibold tracking-tight text-[var(--text-primary)]">Assignments</h2>
            {bulletinPlanTitle ? (
              <p className="mt-1 text-sm text-[var(--text-muted)]">Plan: {bulletinPlanTitle}</p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          {bulletinPlanHref ? (
            <Link
              href={bulletinPlanHref}
              className="text-sm font-semibold text-[#f59e0b] no-underline hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#f59e0b]/30 rounded-sm"
            >
              View plan
            </Link>
          ) : null}
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
            <Badge variant="warning">OPEN</Badge>
            <Badge variant="neutral">PENDING</Badge>
            <Badge variant="success">CONFIRMED</Badge>
            <Badge variant="danger">DECLINED</Badge>
          </div>
          {onRefresh ? (
            <button
              type="button"
              className="btn btn-ghost btn-sm gap-1"
              onClick={onRefresh}
              title="Refresh assignments"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="text-xs">Refresh</span>
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={showOpenOnly}
            onChange={(e) => onToggleOpenOnly(e.target.checked)}
          />
          <span className="text-sm">Open only</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={showPendingOnly}
            onChange={(e) => onTogglePendingOnly(e.target.checked)}
          />
          <span className="text-sm">Pending only</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={showDeclinedOnly}
            onChange={(e) => onToggleDeclinedOnly(e.target.checked)}
          />
          <span className="text-sm">Declined only</span>
        </label>
        <input
          type="text"
          className="input input-bordered input-sm w-full max-w-xs"
          placeholder="Search by role or volunteer"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {serviceProfiles.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-8 text-center mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)]">
            <Users className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>No service team members yet</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Add volunteers to start scheduling.</p>
          </div>
          <Link href="/people" className="mt-2">
            <Button variant="secondary" size="sm">Add volunteers</Button>
          </Link>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="table w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="bg-[var(--surface-container-high)] text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Role
              </th>
              <th className="bg-[var(--surface-container-high)] text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Assigned to
              </th>
              <th className="bg-[var(--surface-container-high)] text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Backup
              </th>
              <th className="bg-[var(--surface-container-high)] text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Status
              </th>
              <th className="bg-[var(--surface-container-high)] text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Notes
              </th>
              <th className="bg-[var(--surface-container-high)] text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-[var(--surface-container-lowest)]">
            {isEmpty ? (
              <tr>
                <td colSpan={6} className="p-0 border-0">
                  <div className="flex flex-col items-center justify-center gap-3 rounded-b-xl bg-[var(--surface)] px-6 py-10 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)]">
                      <Calendar className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {hasNoData ? "No assignments yet" : "No results match your filters"}
                      </p>
                      <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                        {hasNoData
                          ? "Generate a schedule or copy the last service to get started."
                          : "Try adjusting your search or filters."}
                      </p>
                    </div>
                    {hasNoData && (
                      <div className="flex flex-wrap justify-center gap-2 mt-2">
                        <Button variant="primary" size="sm" onClick={onGenerateSchedule}>Generate schedule</Button>
                        <Button variant="secondary" size="sm" onClick={onCopyLast}>Copy last service</Button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              unified.map((row) => {
                // run-of-show item row
                if (row.kind === "item") {
                  const { data: item } = row;
                  const status = statusStyles[item.status] ?? statusStyles.OPEN;
                  const assignedValue = item.assigned_user_id ?? "";
                  const backupValue = item.backup_user_id ?? "";
                  const noteValue = notesDraft[`i-${item.id}`] ?? item.notes ?? "";
                  return (
                    <tr
                      key={`i-${item.id}`}
                      className="border-b border-[var(--border)] transition-colors hover:bg-[var(--surface-container-low)]"
                    >
                      <td>{item.title}</td>
                      <td>
                        <select
                          className="select select-bordered select-sm w-full"
                          value={assignedValue}
                          onChange={(e) => onBulletinItemUpdate?.(item.id, { assigned_user_id: e.target.value || null })}
                        >
                          <option value="">Unassigned</option>
                          {serviceProfiles.map((p) => (
                            <option key={p.id} value={p.id}>{p.full_name || p.email || p.id}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          className="select select-bordered select-sm w-full"
                          value={backupValue}
                          onChange={(e) => onBulletinItemUpdate?.(item.id, { backup_user_id: e.target.value || null })}
                        >
                          <option value="">None</option>
                          {serviceProfiles
                            .filter((p) => p.id !== assignedValue)
                            .map((p) => (
                              <option key={p.id} value={p.id}>{p.full_name || p.email || p.id}</option>
                            ))}
                        </select>
                      </td>
                      <td>
                        <select
                          className="select select-bordered select-sm"
                          value={item.status}
                          onChange={(e) => onBulletinItemUpdate?.(item.id, { status: e.target.value as AssignmentStatus })}
                        >
                          <option value="OPEN">Open</option>
                          <option value="ASSIGNED">Pending</option>
                          <option value="CONFIRMED">Confirmed</option>
                          <option value="DECLINED">Declined</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="input input-sm w-full"
                          placeholder="Add notes"
                          value={noteValue}
                          onChange={(e) => setNotesDraft((prev) => ({ ...prev, [`i-${item.id}`]: e.target.value }))}
                          onBlur={(e) =>
                            onBulletinItemUpdate?.(item.id, { notes: e.target.value.trim() })
                          }
                        />
                      </td>
                      <td>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                    </tr>
                  );
                }

                // bulletin slot row
                const { data: slot } = row;
                const status = statusStyles[slot.status] ?? statusStyles.OPEN;
                const assignedValue = slot.assigned_user_id ?? "";
                const backupValue = slot.backup_user_id ?? "";
                const noteValue = notesDraft[`b-${slot.id}`] ?? slot.notes ?? "";
                return (
                  <tr
                    key={`b-${slot.id}`}
                    className="border-b border-[var(--border)] transition-colors hover:bg-[var(--surface-container-low)]"
                  >
                    <td>{slot.role_name}</td>
                    <td>
                      <select
                        className="select select-bordered select-sm w-full"
                        value={assignedValue}
                        onChange={(e) => onBulletinSlotUpdate?.(slot.id, { assigned_user_id: e.target.value || null })}
                      >
                        <option value="">Unassigned</option>
                        {serviceProfiles.map((p) => (
                          <option key={p.id} value={p.id}>{p.full_name || p.email || p.id}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        className="select select-bordered select-sm w-full"
                        value={backupValue}
                        onChange={(e) => onBulletinSlotUpdate?.(slot.id, { backup_user_id: e.target.value || null })}
                      >
                        <option value="">None</option>
                        {serviceProfiles
                          .filter((p) => p.id !== assignedValue)
                          .map((p) => (
                            <option key={p.id} value={p.id}>{p.full_name || p.email || p.id}</option>
                          ))}
                      </select>
                    </td>
                    <td>
                      <select
                        className="select select-bordered select-sm"
                        value={slot.status}
                        onChange={(e) => onBulletinSlotUpdate?.(slot.id, { status: e.target.value as AssignmentStatus })}
                      >
                        <option value="OPEN">Open</option>
                        <option value="ASSIGNED">Pending</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="DECLINED">Declined</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        className="input input-sm w-full"
                        placeholder="Add notes"
                        value={noteValue}
                        onChange={(e) => setNotesDraft((prev) => ({ ...prev, [`b-${slot.id}`]: e.target.value }))}
                        onBlur={(e) => onBulletinSlotUpdate?.(slot.id, { notes: e.target.value.trim() || null })}
                      />
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={status.variant}>{status.label}</Badge>
                        <Button variant="danger" size="sm" onClick={() => onBulletinSlotDelete?.(slot.id)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
