"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, GripVertical, Loader2, Minus, Plus, Send, StickyNote, X } from "lucide-react";
import SelectMenu from "../ui/SelectMenu";
import { AiButton } from "../ai/AiBrand";
import { EmptySeat, StatusAvatar, STATUS_WORD, type SlotStatus } from "./StatusAvatar";
import PeoplePicker, { type PickerTarget } from "./PeoplePicker";
import { useBoardData } from "./useBoardData";
import { supabase } from "../../lib/supabaseClient";
import { newRowId, type PlanItemDraft, type PlanRoleSlotDraft } from "../../lib/db/servicePlans";

type Role = { id: string; name: string; ministry_id?: string | null };

const QUICK_STEPS = ["Welcome", "Worship", "Prayer", "Sermon", "Announcements", "Offering", "Closing"];

const toMinutes = (hhmm: string | null | undefined) => {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return Number.isFinite(h) ? h * 60 + (m || 0) : null;
};
const clock = (mins: number) => {
  const d = new Date();
  d.setHours(Math.floor(mins / 60) % 24, mins % 60, 0, 0);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};
const fmtLength = (mins: number) => (mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins} min`);

/** Picker target is either a role slot or a run-of-show step. */
type Open = { kind: "slot" | "step"; id: string; anchor: HTMLElement } | null;

export default function ServiceBoard({
  title,
  onTitleChange,
  planId,
  planDate,
  startTime,
  serviceName,
  churchId,
  roles,
  slots,
  onSlotsChange,
  items,
  onItemsChange,
  savingLabel,
  aiEnabled,
  onOpenAi,
}: {
  title: string;
  onTitleChange: (title: string) => void;
  planId: string;
  planDate: string;
  startTime: string | null;
  serviceName: string | null;
  churchId: string;
  roles: Role[];
  slots: PlanRoleSlotDraft[];
  onSlotsChange: (next: PlanRoleSlotDraft[]) => void;
  items: PlanItemDraft[];
  onItemsChange: (next: PlanItemDraft[]) => void;
  savingLabel: string;
  aiEnabled: boolean;
  onOpenAi: () => void;
}) {
  const { people, stats, awayIds, ministries } = useBoardData(churchId, planId, planDate);
  const byId = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const roleById = useMemo(() => new Map(roles.map((r) => [r.id, r])), [roles]);
  const [open, setOpen] = useState<Open>(null);
  const [notesOpen, setNotesOpen] = useState<Set<string>>(new Set());
  const [newStep, setNewStep] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [reminder, setReminder] = useState<{ busy: boolean; msg: string | null }>({ busy: false, msg: null });
  const newStepRef = useRef<HTMLInputElement>(null);

  // Steps keep their answer status in the database; this board edits assignees,
  // so read the stored answers once and treat any changed person as "waiting".
  const [itemAnswers, setItemAnswers] = useState<Map<string, { uid: string | null; status: SlotStatus }>>(new Map());
  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    (supabase as any)
      .from("service_plan_items")
      .select("id, assigned_user_id, assignment_status")
      .eq("plan_id", planId)
      .then(({ data }: { data: { id: string; assigned_user_id: string | null; assignment_status: SlotStatus | null }[] | null }) => {
        if (!alive) return;
        setItemAnswers(new Map((data ?? []).map((r) => [r.id, { uid: r.assigned_user_id, status: (r.assignment_status ?? "ASSIGNED") as SlotStatus }])));
      });
    return () => { alive = false; };
  }, [planId]);
  const itemStatus = (it: PlanItemDraft): SlotStatus => {
    if (!it.assigned_user_id) return "OPEN";
    const saved = itemAnswers.get(it.id);
    return saved && saved.uid === it.assigned_user_id ? saved.status : "ASSIGNED";
  };

  // "N" adds a step from anywhere on the board (not while typing).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
      if (!typing && !e.metaKey && !e.ctrlKey && !e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        newStepRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ── Who serves where (for "Already on Bass") ── */
  const busyById = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of slots) {
      const name = roleById.get(s.role_id)?.name ?? "a role";
      if (s.assigned_user_id && s.status !== "DECLINED" && !m.has(s.assigned_user_id)) m.set(s.assigned_user_id, name);
    }
    for (const it of items) if (it.assigned_user_id && !m.has(it.assigned_user_id)) m.set(it.assigned_user_id, it.title || "a step");
    return m;
  }, [slots, items, roleById]);

  /* ── Readiness ── */
  const counts = useMemo(() => {
    const c = { confirmed: 0, waiting: 0, declined: 0, open: 0 };
    for (const s of slots) {
      if (!s.assigned_user_id || s.status === "OPEN") c.open++;
      else if (s.status === "CONFIRMED") c.confirmed++;
      else if (s.status === "DECLINED") c.declined++;
      else c.waiting++;
    }
    for (const it of items) {
      const st = itemStatus(it);
      if (st === "CONFIRMED") c.confirmed++;
      else if (st === "ASSIGNED") c.waiting++;
      else if (st === "DECLINED") c.declined++;
    }
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots, items, itemAnswers]);
  const total = counts.confirmed + counts.waiting + counts.declined + counts.open;
  const pct = (n: number) => (total ? `${(n / total) * 100}%` : "0%");

  /* ── Clock times ── */
  const start = toMinutes(startTime);
  const totalMinutes = items.reduce((sum, it) => sum + (it.duration_minutes ?? 0), 0);
  let running = 0;
  const timeline = items.map((it) => {
    const at = running;
    running += it.duration_minutes ?? 0;
    return at;
  });

  /* ── Mutations (parent autosaves) ── */
  const patchSlot = (id: string, patch: Partial<PlanRoleSlotDraft>) =>
    onSlotsChange(slots.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const patchItem = (id: string, patch: Partial<PlanItemDraft>) =>
    onItemsChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const assignSlot = (s: PlanRoleSlotDraft, uid: string | null) =>
    patchSlot(s.id, {
      assigned_user_id: uid,
      backup_user_id: uid && s.backup_user_id === uid ? null : s.backup_user_id,
      // Same rule as the database: a new person hasn't answered yet.
      status: uid ? (uid === s.assigned_user_id ? s.status : "ASSIGNED") : "OPEN",
    });

  const addSeat = (roleId: string) => {
    const existing = slots.filter((s) => s.role_id === roleId);
    onSlotsChange([
      ...slots,
      { id: newRowId(), role_id: roleId, sort_order: existing.length, assigned_user_id: null, backup_user_id: null, status: "OPEN", notes: "" },
    ]);
  };
  const removeSeat = (roleId: string) => {
    const seats = slots.filter((s) => s.role_id === roleId);
    // Drop an empty seat first; never silently remove a person.
    const victim = [...seats].reverse().find((s) => !s.assigned_user_id);
    if (!victim) return;
    onSlotsChange(slots.filter((s) => s.id !== victim.id));
  };

  const addStep = (title: string) => {
    const t = title.trim();
    if (!t) return;
    onItemsChange([
      ...items,
      { id: newRowId(), title: t, duration_minutes: 5, notes: "", owner_role_id: null, assigned_user_id: null, backup_user_id: null, status: "PLANNED" },
    ]);
  };
  const moveStep = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    const next = [...items];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    onItemsChange(next);
  };

  const sendReminders = async () => {
    setReminder({ busy: true, msg: null });
    const res = await fetch("/api/notifications/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId }),
    });
    const json = await res.json().catch(() => ({}));
    setReminder({
      busy: false,
      msg: !res.ok
        ? json.error ?? "Couldn't send reminders."
        : json.dispatched > 0
          ? `Reminded ${json.dispatched} ${json.dispatched === 1 ? "person" : "people"}.`
          : "Everyone was already reminded today.",
    });
  };

  /* ── Team grouped by ministry ── */
  const ministryName = useMemo(() => new Map(ministries.map((m) => [m.id, m.name])), [ministries]);
  const staffed = roles.filter((r) => slots.some((s) => s.role_id === r.id));
  const unstaffed = roles.filter((r) => !slots.some((s) => s.role_id === r.id));
  const groups = useMemo(() => {
    const g = new Map<string, Role[]>();
    for (const r of staffed) {
      const key = (r.ministry_id && ministryName.get(r.ministry_id)) || "Other";
      g.set(key, [...(g.get(key) ?? []), r]);
    }
    return [...g.entries()].sort((a, b) => (a[0] === "Other" ? 1 : b[0] === "Other" ? -1 : a[0].localeCompare(b[0])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffed.map((r) => r.id).join(), ministryName]);

  /* ── Picker wiring ── */
  const openSlot = open?.kind === "slot" ? slots.find((s) => s.id === open.id) : undefined;
  const openStep = open?.kind === "step" ? items.find((it) => it.id === open.id) : undefined;
  const pickerTarget: PickerTarget | null = openSlot
    ? {
        label: roleById.get(openSlot.role_id)?.name ?? "Role",
        roleId: openSlot.role_id,
        assignedId: openSlot.assigned_user_id,
        backupId: openSlot.backup_user_id,
        status: openSlot.assigned_user_id ? (openSlot.status as SlotStatus) : "OPEN",
        notes: openSlot.notes,
        removable: true,
        canConfirm: true,
      }
    : openStep
      ? {
          label: openStep.title || "This step",
          roleId: openStep.owner_role_id,
          assignedId: openStep.assigned_user_id,
          backupId: openStep.backup_user_id,
          status: itemStatus(openStep),
        }
      : null;

  const personLabel = (uid: string, status: SlotStatus, what: string) =>
    `${byId.get(uid)?.name ?? "Someone"} · ${what} · ${STATUS_WORD[status]}`;

  return (
    <div className="space-y-4">
      {/* ── Sticky readiness bar ── */}
      <div className="sticky top-3 z-30 -mx-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/95 px-4 py-3 shadow-[0_8px_24px_-18px_rgba(40,30,10,0.4)] backdrop-blur">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="min-w-0 flex-1 basis-56">
            <input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              aria-label="Service title"
              className="w-full truncate rounded-lg border border-transparent bg-transparent px-1 -ml-1 text-base font-semibold text-[var(--text-primary)] outline-none transition-colors hover:border-[var(--border)] focus:border-amber-300 focus:ring-2 focus:ring-amber-100"
            />
            <p className="px-0 text-xs text-[var(--text-muted)]">
              {new Date(`${planDate}T12:00:00`).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
              {start !== null ? ` · ${clock(start)}` : ""}
              {serviceName ? ` · ${serviceName}` : ""}
              <span className="ml-2 text-[var(--text-muted)]/80">· {savingLabel}</span>
            </p>
          </div>
          <div className="flex min-w-[220px] flex-1 basis-60 flex-col gap-1.5">
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-[var(--surface-2)]" role="img" aria-label={`${counts.confirmed} confirmed, ${counts.waiting} waiting, ${counts.declined} declined, ${counts.open} open`}>
              <span className="h-full bg-emerald-500 transition-[width] duration-500" style={{ width: pct(counts.confirmed) }} />
              <span className="h-full bg-amber-300 transition-[width] duration-500" style={{ width: pct(counts.waiting) }} />
              <span className="h-full bg-red-400 transition-[width] duration-500" style={{ width: pct(counts.declined) }} />
            </div>
            <div className="flex flex-wrap gap-1.5 text-[11px] font-medium">
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">{counts.confirmed} confirmed</span>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-800">{counts.waiting} waiting</span>
              {counts.declined > 0 && <span className="rounded-full bg-red-50 px-2 py-0.5 text-red-700">{counts.declined} declined</span>}
              <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[var(--text-secondary)]">{counts.open} open</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={sendReminders} disabled={reminder.busy || counts.waiting === 0} className="btn btn-secondary h-9 gap-1.5 px-3 text-xs" title={counts.waiting === 0 ? "No one is waiting to reply" : "Remind everyone who hasn't replied"}>
              {reminder.busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Send reminders
            </button>
            {aiEnabled && <AiButton onClick={onOpenAi}>Fill with AI</AiButton>}
          </div>
        </div>
        {reminder.msg && <p role="status" className="mt-1.5 text-xs text-[var(--text-secondary)]">{reminder.msg}</p>}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        {/* ── Order of service ── */}
        <section className="stitch-section-card" aria-labelledby="oos-title">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h2 id="oos-title" className="text-sm font-semibold text-[var(--text-primary)]">Order of service</h2>
            <span className="text-xs text-[var(--text-muted)]">
              {fmtLength(totalMinutes)}{start !== null ? ` · ends ${clock(start + totalMinutes)}` : ""}
            </span>
          </div>
          {items.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--text-muted)]">No steps yet. Add the first one below.</p>
          ) : (
            <ol className="divide-y divide-[var(--divider)]">
              {items.map((it, i) => {
                const st = itemStatus(it);
                const showNotes = notesOpen.has(it.id) || !!it.notes;
                return (
                  <li
                    key={it.id}
                    draggable
                    onDragStart={(e) => { setDragId(it.id); e.dataTransfer.effectAllowed = "move"; }}
                    onDragOver={(e) => { e.preventDefault(); }}
                    onDrop={() => { if (dragId) moveStep(items.findIndex((x) => x.id === dragId), i); setDragId(null); }}
                    onDragEnd={() => setDragId(null)}
                    className={`group py-2 ${dragId === it.id ? "rounded-xl bg-amber-50/60 outline outline-1 outline-dashed outline-amber-300" : ""}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                      <div className="w-[68px] shrink-0 whitespace-nowrap tabular-nums">
                        <p className="text-xs font-semibold text-[var(--text-secondary)]">{start !== null ? clock(start + timeline[i]) : `+${timeline[i]}m`}</p>
                        <label className="flex items-center gap-0.5 text-[10.5px] text-[var(--text-muted)]">
                          <input
                            type="number"
                            min={0}
                            value={it.duration_minutes ?? ""}
                            onChange={(e) => patchItem(it.id, { duration_minutes: e.target.value === "" ? null : Math.max(0, Number(e.target.value)) })}
                            aria-label={`Length of ${it.title || "step"} in minutes`}
                            className="w-6 bg-transparent text-[10.5px] outline-none [appearance:textfield] focus:text-[var(--text-primary)] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          />
                          min
                        </label>
                      </div>
                      <input
                        value={it.title}
                        onChange={(e) => patchItem(it.id, { title: e.target.value })}
                        placeholder="Step title"
                        aria-label={`Step ${i + 1} title`}
                        className="h-8 min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 text-sm font-medium text-[var(--text-primary)] outline-none transition-colors hover:border-[var(--border)] focus:border-amber-300 focus:bg-[var(--surface)] focus:ring-2 focus:ring-amber-100"
                      />
                      {it.assigned_user_id ? (
                        <StatusAvatar
                          person={byId.get(it.assigned_user_id) ?? { name: "Member" }}
                          status={st}
                          backup={it.backup_user_id ? byId.get(it.backup_user_id) ?? null : null}
                          size={28}
                          label={personLabel(it.assigned_user_id, st, it.title || "this step")}
                          onClick={(e) => setOpen({ kind: "step", id: it.id, anchor: e.currentTarget })}
                        />
                      ) : (
                        <EmptySeat
                          size={28}
                          label={`Assign someone to ${it.title || "this step"}`}
                          onClick={(e) => setOpen({ kind: "step", id: it.id, anchor: e.currentTarget })}
                        />
                      )}
                      <div className="flex shrink-0 items-center opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                        <button type="button" onClick={() => setNotesOpen((s) => { const n = new Set(s); n.has(it.id) ? n.delete(it.id) : n.add(it.id); return n; })} aria-label="Notes" title="Notes" className={`rounded-md p-1.5 transition-colors hover:bg-[var(--surface-2)] ${it.notes ? "text-amber-600" : "text-[var(--text-muted)]"}`}>
                          <StickyNote className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => moveStep(i, i - 1)} disabled={i === 0} aria-label="Move up" className="rounded-md p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] disabled:opacity-30"><ChevronUp className="h-3.5 w-3.5" /></button>
                        <button type="button" onClick={() => moveStep(i, i + 1)} disabled={i === items.length - 1} aria-label="Move down" className="rounded-md p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] disabled:opacity-30"><ChevronDown className="h-3.5 w-3.5" /></button>
                        <button type="button" onClick={() => onItemsChange(items.filter((x) => x.id !== it.id))} aria-label={`Remove ${it.title || "step"}`} className="rounded-md p-1.5 text-[var(--text-muted)] transition-colors hover:bg-red-50 hover:text-red-600"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                    {showNotes && (
                      <input
                        value={it.notes}
                        onChange={(e) => patchItem(it.id, { notes: e.target.value })}
                        placeholder="Notes for this step…"
                        aria-label={`Notes for ${it.title || "step"}`}
                        className="ml-[102px] mt-1 h-7 w-[calc(100%-102px)] rounded-lg bg-[var(--surface-2)] px-2.5 text-xs text-[var(--text-secondary)] outline-none placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-amber-100"
                      />
                    )}
                  </li>
                );
              })}
            </ol>
          )}
          <form
            className="mt-3 flex items-center gap-2"
            onSubmit={(e) => { e.preventDefault(); addStep(newStep); setNewStep(""); }}
          >
            <div className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-xl border border-dashed border-[var(--outline-variant)] px-3 focus-within:border-amber-300 focus-within:ring-2 focus-within:ring-amber-100">
              <Plus className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" aria-hidden />
              <input
                ref={newStepRef}
                value={newStep}
                onChange={(e) => setNewStep(e.target.value)}
                placeholder="Add a step…"
                aria-label="New step title"
                className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
              />
              <kbd className="hidden rounded border border-[var(--border)] bg-[var(--surface-2)] px-1.5 text-[10px] text-[var(--text-muted)] sm:inline">N</kbd>
            </div>
          </form>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {QUICK_STEPS.map((q) => (
              <button key={q} type="button" onClick={() => addStep(q)} className="rounded-full border border-[var(--border)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)] transition hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50">
                + {q}
              </button>
            ))}
          </div>
        </section>

        {/* ── Team ── */}
        <section className="stitch-section-card" aria-labelledby="team-title">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h2 id="team-title" className="text-sm font-semibold text-[var(--text-primary)]">Team</h2>
            <span className="text-xs text-[var(--text-muted)]">{slots.length} {slots.length === 1 ? "spot" : "spots"} · {groups.length} {groups.length === 1 ? "ministry" : "ministries"}</span>
          </div>
          {groups.length === 0 && (
            <p className="py-4 text-center text-sm text-[var(--text-muted)]">Add the roles this service needs below.</p>
          )}
          <div className="space-y-4">
            {groups.map(([group, groupRoles]) => {
              const seats = slots.filter((s) => groupRoles.some((r) => r.id === s.role_id));
              const filled = seats.filter((s) => s.assigned_user_id && s.status !== "DECLINED").length;
              return (
                <div key={group}>
                  <p className="mb-1 flex justify-between text-[10.5px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    <span>{group}</span>
                    <span className={filled < seats.length ? "text-amber-700" : "text-emerald-700"}>{filled} / {seats.length}</span>
                  </p>
                  <ul>
                    {groupRoles.map((role) => {
                      const roleSeats = slots.filter((s) => s.role_id === role.id).sort((a, b) => a.sort_order - b.sort_order);
                      const empty = roleSeats.filter((s) => !s.assigned_user_id).length;
                      return (
                        <li key={role.id} className="group flex items-center gap-2 rounded-xl px-1.5 py-1.5 transition-colors hover:bg-[var(--surface-2)]">
                          <span className="min-w-0 flex-1 truncate text-sm text-[var(--text-primary)]">{role.name}</span>
                          <div className="flex shrink-0 items-center opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                            <button type="button" onClick={() => removeSeat(role.id)} disabled={empty === 0} aria-label={`One fewer ${role.name}`} title={empty === 0 ? "Clear someone first to remove their spot" : "One fewer spot"} className="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--surface)] disabled:opacity-30"><Minus className="h-3 w-3" /></button>
                            <button type="button" onClick={() => addSeat(role.id)} aria-label={`One more ${role.name}`} title="One more spot" className="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--surface)]"><Plus className="h-3 w-3" /></button>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {roleSeats.map((s) =>
                              s.assigned_user_id ? (
                                <StatusAvatar
                                  key={s.id}
                                  person={byId.get(s.assigned_user_id) ?? { name: "Member" }}
                                  status={s.status as SlotStatus}
                                  backup={s.backup_user_id ? byId.get(s.backup_user_id) ?? null : null}
                                  size={28}
                                  label={personLabel(s.assigned_user_id, s.status as SlotStatus, role.name)}
                                  onClick={(e) => setOpen({ kind: "slot", id: s.id, anchor: e.currentTarget })}
                                />
                              ) : (
                                <EmptySeat
                                  key={s.id}
                                  size={28}
                                  label={`Assign ${role.name}`}
                                  onClick={(e) => setOpen({ kind: "slot", id: s.id, anchor: e.currentTarget })}
                                />
                              )
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
          {unstaffed.length > 0 && (
            <div className="mt-4 border-t border-[var(--border)] pt-3">
              <SelectMenu
                size="sm"
                searchable
                value=""
                ariaLabel="Add a role to this service"
                placeholder="+ Add a role to this service"
                options={unstaffed.map((r) => ({ value: r.id, label: r.name, hint: (r.ministry_id && ministryName.get(r.ministry_id)) || undefined }))}
                onChange={(roleId) => roleId && addSeat(roleId)}
              />
            </div>
          )}
        </section>
      </div>

      {open && pickerTarget && (
        <PeoplePicker
          key={`${open.kind}-${open.id}`}
          anchor={open.anchor}
          target={pickerTarget}
          people={people}
          stats={stats}
          awayIds={awayIds}
          busyById={busyById}
          planDate={planDate}
          onClose={() => setOpen(null)}
          onAssign={(uid) => {
            if (openSlot) assignSlot(openSlot, uid);
            else if (openStep) patchItem(openStep.id, { assigned_user_id: uid, backup_user_id: uid && openStep.backup_user_id === uid ? null : openStep.backup_user_id });
          }}
          onBackup={(uid) => {
            if (openSlot) patchSlot(openSlot.id, { backup_user_id: uid });
            else if (openStep) patchItem(openStep.id, { backup_user_id: uid });
          }}
          onConfirm={openSlot ? () => patchSlot(openSlot.id, { status: "CONFIRMED" }) : undefined}
          onNotes={openSlot ? (notes) => patchSlot(openSlot.id, { notes }) : undefined}
          onRemoveSlot={openSlot ? () => onSlotsChange(slots.filter((s) => s.id !== openSlot.id)) : undefined}
        />
      )}
    </div>
  );
}
