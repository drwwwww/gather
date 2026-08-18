"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronLeft, ChevronRight, Calendar, Clock, Plus } from "lucide-react";
import { format } from "date-fns";

const STATUS_STYLE: Record<string, string> = {
  "NOT CREATED": "bg-slate-100 text-slate-500 ring-slate-200",
  DRAFT:         "bg-amber-50  text-amber-700  ring-amber-200",
  READY:         "bg-green-50  text-green-700  ring-green-200",
  COMPLETED:     "bg-blue-50   text-blue-700   ring-blue-200",
};

function parseLocalDate(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}
function toYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const todayYmd = toYmd(new Date());

/** "09:00" → "9:00 AM", "13:30" → "1:30 PM" */
function formatTime(value: string): string {
  if (!value) return "";
  const [hStr, mStr] = value.split(":");
  const h = parseInt(hStr ?? "0", 10);
  const m = parseInt(mStr ?? "0", 10);
  const h12 = h % 12 || 12;
  const ampm = h < 12 ? "AM" : "PM";
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

/** Minutes since midnight */
function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

const TIME_OPTIONS: { label: string; value: string }[] = (() => {
  const opts = [];
  for (let h = 5; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const h12 = h % 12 || 12;
      const ampm = h < 12 ? "AM" : "PM";
      opts.push({
        label: `${h12}:${String(m).padStart(2, "0")} ${ampm}`,
        value: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
      });
    }
  }
  return opts;
})();

function TimePicker({
  value,
  onChange,
  blockedTimes = [],
  minGapMinutes = 120,
  placeholder = "Set time",
}: {
  value: string;
  onChange: (v: string) => void;
  blockedTimes?: string[];
  minGapMinutes?: number;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ left: number; top: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        listRef.current && !listRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  // Scroll selected item into view when the list opens
  useEffect(() => {
    if (!open || !value || !listRef.current) return;
    const active = listRef.current.querySelector<HTMLElement>("[data-active='true']");
    if (active) active.scrollIntoView({ block: "center" });
  }, [open, value]);

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setAnchor({ left: r.left, top: r.bottom + 6 });
    }
    setOpen((o) => !o);
  };

  const isBlocked = (v: string) =>
    blockedTimes.some((b) => Math.abs(toMinutes(v) - toMinutes(b)) < minGapMinutes);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface)] focus:outline-none"
      >
        <Clock className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
        <span>{value ? formatTime(value) : <span className="text-[var(--text-muted)]">{placeholder}</span>}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-[var(--text-muted)] transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && anchor && typeof document !== "undefined" && createPortal(
        <ul
          ref={listRef}
          style={{ position: "fixed", left: anchor.left, top: anchor.top, width: 144 }}
          className="z-[1001] max-h-60 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-lg"
        >
          {TIME_OPTIONS.map((opt) => {
            const blocked = isBlocked(opt.value);
            const active = opt.value === value;
            return (
              <li key={opt.value} className="list-none" data-active={String(active)}>
                <button
                  type="button"
                  disabled={blocked}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`flex w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors
                    ${active ? "bg-amber-500 font-semibold text-white" : ""}
                    ${!active && !blocked ? "text-[var(--text-primary)] hover:bg-[var(--surface-2)]" : ""}
                    ${blocked ? "cursor-not-allowed text-[var(--text-muted)] opacity-40" : ""}
                  `}
                  title={blocked ? "Too close to another service (min. 2 hours)" : undefined}
                >
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>,
        document.body
      )}
    </div>
  );
}

function CalendarPicker({ value, onChange }: { value: string; onChange: (ymd: string) => void }) {
  const [open, setOpen] = useState(false);
  const [calMonth, setCalMonth] = useState(() => (value || todayYmd).slice(0, 7) + "-01");

  const firstOfMonth = parseLocalDate(calMonth);
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());
  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart); d.setDate(gridStart.getDate() + i); return toYmd(d);
  });
  const displayDate = value ? format(parseLocalDate(value), "MMM d, yyyy") : "Pick a date";

  return (
    <>
      <button type="button" onClick={() => { setCalMonth((value || todayYmd).slice(0, 7) + "-01"); setOpen(o => !o); }}
        className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface)] focus:outline-none">
        <Calendar className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
        <span>{displayDate}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-[var(--text-muted)] transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-[340px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <button type="button" onClick={() => { const d = parseLocalDate(calMonth); d.setMonth(d.getMonth()-1); setCalMonth(toYmd(d).slice(0,7)+"-01"); }}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--surface-2)]">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold text-[var(--text-primary)]">{format(parseLocalDate(calMonth), "MMMM yyyy")}</span>
              <button type="button" onClick={() => { const d = parseLocalDate(calMonth); d.setMonth(d.getMonth()+1); setCalMonth(toYmd(d).slice(0,7)+"-01"); }}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--surface-2)]">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="p-3">
              <div className="mb-1 grid grid-cols-7">{["Su","Mo","Tu","We","Th","Fr","Sa"].map(w => <span key={w} className="flex h-6 items-center justify-center text-[10px] font-semibold text-[var(--text-muted)]">{w}</span>)}</div>
              <div className="grid grid-cols-7 gap-0.5">
                {days.map(ymd => {
                  const inMonth = ymd.slice(0,7) === calMonth.slice(0,7);
                  const isSel = ymd === value;
                  const isToday = ymd === todayYmd;
                  return <button key={ymd} type="button" onClick={() => { onChange(ymd); setOpen(false); }}
                    className={`flex h-9 w-full items-center justify-center rounded-xl text-sm transition-colors ${isSel ? "bg-amber-500 font-semibold text-white" : inMonth ? "text-[var(--text-primary)] hover:bg-[var(--surface-2)]" : "text-[var(--text-muted)] opacity-40"} ${!isSel && isToday ? "ring-1 ring-inset ring-amber-400" : ""}`}>
                    {parseLocalDate(ymd).getDate()}
                  </button>;
                })}
              </div>
            </div>
            <div className="flex justify-between border-t border-[var(--border)] px-4 py-2.5">
              <button type="button" onClick={() => { onChange(todayYmd); setOpen(false); }} className="text-sm font-medium text-amber-600 hover:text-amber-800">Today</button>
              <button type="button" onClick={() => setOpen(false)} className="text-sm text-[var(--text-muted)]">Close</button>
            </div>
          </div>
        </div>, document.body
      )}
    </>
  );
}

export type ServiceEntry = {
  id: string;
  startTime: string | null;
};

type ServicePlanHeaderProps = {
  serviceDate: string;
  startTime?: string;
  statusLabel: string;
  servicesOnDate?: ServiceEntry[];
  activePlanId?: string | null;
  onServiceDateChange: (value: string) => void;
  onStartTimeChange?: (value: string) => void;
  onSwitchService?: (id: string) => void;
  onAddSecondService?: (startTime: string) => void;
  actions?: ReactNode;
};

export default function ServicePlanHeader({
  serviceDate, startTime = "", statusLabel,
  servicesOnDate = [], activePlanId = null,
  onServiceDateChange, onStartTimeChange,
  onSwitchService, onAddSecondService,
  actions,
}: ServicePlanHeaderProps) {
  const statusClass = STATUS_STYLE[statusLabel] ?? STATUS_STYLE["NOT CREATED"];
  const [addingSecond, setAddingSecond] = useState(false);
  const [secondTime, setSecondTime] = useState("");

  const showSwitcher = servicesOnDate.length >= 2;
  const canAddSecond = servicesOnDate.length === 1 && !!onAddSecondService;
  const existingTimes = servicesOnDate.map((s) => s.startTime).filter(Boolean) as string[];

  const handleConfirmSecond = () => {
    if (!secondTime || !onAddSecondService) return;
    onAddSecondService(secondTime);
    setAddingSecond(false);
    setSecondTime("");
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: date + time/switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <CalendarPicker value={serviceDate} onChange={onServiceDateChange} />

          {showSwitcher ? (
            /* Service tabs */
            <div className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-1">
              {servicesOnDate.map((svc, i) => {
                const isActive = svc.id === activePlanId;
                return (
                  <button
                    key={svc.id}
                    type="button"
                    onClick={() => onSwitchService?.(svc.id)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none
                      ${isActive
                        ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      }`}
                  >
                    {svc.startTime ? formatTime(svc.startTime) : `Service ${i + 1}`}
                  </button>
                );
              })}
            </div>
          ) : (
            /* Single time picker */
            <TimePicker
              value={startTime}
              onChange={(v) => onStartTimeChange?.(v)}
              blockedTimes={existingTimes.filter((t) => t !== startTime)}
            />
          )}

          {/* Add 2nd service */}
          {canAddSecond && !addingSecond && (
            <button
              type="button"
              onClick={() => setAddingSecond(true)}
              className="flex items-center gap-1.5 rounded-xl border border-dashed border-[var(--border)] px-3 py-2 text-sm text-[var(--text-muted)] transition-colors hover:border-[var(--outline-variant)] hover:text-[var(--text-primary)] focus:outline-none"
            >
              <Plus className="h-3.5 w-3.5" />
              Add 2nd service
            </button>
          )}

          {/* Inline time picker for 2nd service */}
          {addingSecond && (
            <div className="flex items-center gap-2">
              <TimePicker
                value={secondTime}
                onChange={setSecondTime}
                blockedTimes={existingTimes}
                placeholder="Pick time"
              />
              <button
                type="button"
                disabled={!secondTime}
                onClick={handleConfirmSecond}
                className="rounded-xl bg-amber-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-40 focus:outline-none"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => { setAddingSecond(false); setSecondTime(""); }}
                className="rounded-xl px-3 py-2 text-sm text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] focus:outline-none"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Status badge */}
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${statusClass}`}>
            {statusLabel}
          </span>
        </div>

        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
