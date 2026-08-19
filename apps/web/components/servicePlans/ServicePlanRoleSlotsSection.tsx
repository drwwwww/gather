"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Minus, Plus, StickyNote, X } from "lucide-react";
import type { AssignmentStatus } from "@gather/lib";
import type { Database } from "@gather/lib";
import type { PlanRoleSlotDraft } from "../../lib/db/servicePlans";
import SelectMenu, { type SelectOption } from "../ui/SelectMenu";

type RoleRow = Database["public"]["Tables"]["volunteer_roles"]["Row"];

export type ChurchMemberOption = {
  id: string;
  full_name: string | null;
  email: string | null;
};

const STATUS_OPTIONS: SelectOption[] = [
  { value: "OPEN", label: "Open", tone: "default" },
  { value: "ASSIGNED", label: "Assigned", tone: "info" },
  { value: "CONFIRMED", label: "Confirmed", tone: "success" },
  { value: "DECLINED", label: "Declined", tone: "danger" },
];

const memberLabel = (m: ChurchMemberOption) =>
  m.full_name?.trim() || m.email || m.id.slice(0, 8);

export default function ServicePlanRoleSlotsSection({
  slots,
  roles,
  members,
  onChange,
  onAdjustRoleCount,
  onRemoveSlot,
}: {
  slots: PlanRoleSlotDraft[];
  roles: RoleRow[];
  members: ChurchMemberOption[];
  onChange: (id: string, patch: Partial<PlanRoleSlotDraft>) => void;
  onAdjustRoleCount: (roleId: string, delta: number) => void;
  onRemoveSlot: (id: string) => void;
}) {
  const [sectionOpen, setSectionOpen] = useState(true);
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());
  const [openNotes, setOpenNotes] = useState<Set<string>>(new Set());
  const [showUnstaffed, setShowUnstaffed] = useState(false);

  const toggle = (set: Set<string>, key: string) => {
    const next = new Set(set);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  };

  const memberOptions = useMemo<SelectOption[]>(
    () => [
      { value: "", label: "Unassigned" },
      ...members.map((m) => ({ value: m.id, label: memberLabel(m) })),
    ],
    [members]
  );

  const slotsByRole = useMemo(() => {
    const map = new Map<string, PlanRoleSlotDraft[]>();
    for (const s of slots) {
      const list = map.get(s.role_id) ?? [];
      list.push(s);
      map.set(s.role_id, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.sort_order - b.sort_order);
    return map;
  }, [slots]);

  // Roles with no slots are noise while building a plan — 18 empty rows push
  // the real work off-screen. They stay one click away.
  const staffed = roles.filter((r) => (slotsByRole.get(r.id)?.length ?? 0) > 0);
  const unstaffed = roles.filter((r) => (slotsByRole.get(r.id)?.length ?? 0) === 0);
  const visibleRoles = showUnstaffed ? roles : staffed;

  const totals = useMemo(() => {
    const t = { total: slots.length, confirmed: 0, open: 0, declined: 0 };
    for (const s of slots) {
      if (s.status === "CONFIRMED") t.confirmed++;
      else if (s.status === "DECLINED") t.declined++;
      else if (s.status === "OPEN" || !s.assigned_user_id) t.open++;
    }
    return t;
  }, [slots]);

  return (
    <div className="stitch-section-card">
      <div className={`flex flex-wrap items-center justify-between gap-2 ${sectionOpen ? "mb-3" : ""}`}>
        <button
          type="button"
          onClick={() => setSectionOpen((o) => !o)}
          aria-expanded={sectionOpen}
          className="group flex min-w-0 items-center gap-1.5 text-left"
        >
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform duration-200 ${
              sectionOpen ? "" : "-rotate-90"
            }`}
          />
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-[var(--text-primary)] group-hover:text-amber-600">
              Roles for this service
            </span>
            {sectionOpen && (
              <span className="mt-0.5 block text-xs text-[var(--text-muted)]">
                Set how many people each role needs, then assign them.
              </span>
            )}
          </span>
        </button>
        {totals.total > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] font-medium">
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
              {totals.confirmed} confirmed
            </span>
            {totals.open > 0 && (
              <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[var(--text-muted)]">
                {totals.open} open
              </span>
            )}
            {totals.declined > 0 && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-red-600">
                {totals.declined} declined
              </span>
            )}
          </div>
        )}
      </div>

      {!sectionOpen ? null : !roles.length ? (
        <p className="text-xs text-[var(--text-muted)]">
          Create volunteer roles under Volunteers first.
        </p>
      ) : (
        <div className="space-y-1.5">
          {visibleRoles.map((role) => {
            const roleSlots = slotsByRole.get(role.id) ?? [];
            const count = roleSlots.length;
            const isOpen = expandedRoles.has(role.id) || count > 0;
            const filled = roleSlots.filter((s) => s.assigned_user_id).length;

            return (
              <div
                key={role.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg)]"
              >
                {/* Role header */}
                <div className="flex items-center justify-between gap-2 px-2.5 py-1.5">
                  <button
                    type="button"
                    onClick={() => setExpandedRoles((p) => toggle(p, role.id))}
                    className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                  >
                    {isOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
                    )}
                    <span className="truncate text-xs font-semibold text-[var(--text-primary)]">
                      {role.name}
                    </span>
                    {count > 0 && (
                      <span className="shrink-0 text-[10px] tabular-nums text-[var(--text-muted)]">
                        {filled}/{count}
                      </span>
                    )}
                  </button>

                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      aria-label={`Remove a ${role.name} slot`}
                      disabled={count <= 0}
                      onClick={() => onAdjustRoleCount(role.id, -1)}
                      className="flex h-6 w-6 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)] disabled:opacity-30"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-semibold tabular-nums text-[var(--text-primary)]">
                      {count}
                    </span>
                    <button
                      type="button"
                      aria-label={`Add a ${role.name} slot`}
                      onClick={() => onAdjustRoleCount(role.id, 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* One row per slot */}
                {isOpen && count > 0 && (
                  <div className="border-t border-[var(--border)]">
                    {roleSlots.map((slot) => {
                      const notesOpen = openNotes.has(slot.id) || !!slot.notes;
                      return (
                        <div
                          key={slot.id}
                          className="border-b border-[var(--border)] px-2.5 py-1.5 last:border-b-0"
                        >
                          <div className="flex items-center gap-1.5">
                            <SelectMenu
                              size="sm"
                              className="w-[116px] shrink-0"
                              ariaLabel="Status"
                              value={slot.status}
                              options={STATUS_OPTIONS}
                              onChange={(v) =>
                                onChange(slot.id, { status: v as AssignmentStatus })
                              }
                            />
                            <SelectMenu
                              size="sm"
                              searchable
                              className="min-w-0 flex-1"
                              ariaLabel="Assigned person"
                              placeholder="Unassigned"
                              value={slot.assigned_user_id ?? ""}
                              options={memberOptions}
                              onChange={(v) =>
                                onChange(slot.id, {
                                  assigned_user_id: v || null,
                                  // Assigning someone moves an untouched slot forward;
                                  // clearing it sends the slot back to Open.
                                  status: v
                                    ? slot.status === "OPEN"
                                      ? "ASSIGNED"
                                      : slot.status
                                    : "OPEN",
                                })
                              }
                            />
                            <SelectMenu
                              size="sm"
                              searchable
                              className="hidden min-w-0 flex-1 sm:block"
                              ariaLabel="Backup"
                              placeholder="No backup"
                              value={slot.backup_user_id ?? ""}
                              options={memberOptions}
                              onChange={(v) => onChange(slot.id, { backup_user_id: v || null })}
                            />
                            <button
                              type="button"
                              aria-label="Toggle notes"
                              onClick={() => setOpenNotes((p) => toggle(p, slot.id))}
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                                slot.notes
                                  ? "border-amber-200 bg-amber-50 text-amber-600"
                                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
                              }`}
                            >
                              <StickyNote className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label="Remove slot"
                              onClick={() => onRemoveSlot(slot.id)}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {notesOpen && (
                            <input
                              value={slot.notes}
                              onChange={(e) => onChange(slot.id, { notes: e.target.value })}
                              placeholder="Note for this slot — arrive early, bring music, etc."
                              className="mt-1.5 h-8 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-amber-300 focus:ring-2 focus:ring-[var(--primary-soft)]"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {unstaffed.length > 0 && (
            <button
              type="button"
              onClick={() => setShowUnstaffed((s) => !s)}
              className="w-full rounded-lg border border-dashed border-[var(--border)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-muted)] transition-colors hover:border-[var(--outline-variant)] hover:text-[var(--text-secondary)]"
            >
              {showUnstaffed
                ? "Hide unused roles"
                : `Show ${unstaffed.length} more role${unstaffed.length !== 1 ? "s" : ""}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
