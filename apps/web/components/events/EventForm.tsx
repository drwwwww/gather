"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MapPin, Clock, Users, ChevronDown, Calendar as CalIcon } from "lucide-react";
import { format } from "date-fns";
import EventTemplates, { type EventTemplate } from "./EventTemplates";
import ImageUpload from "../announcements/ImageUpload";

export type EventFormValues = {
  title: string;
  description: string;
  location: string;
  audience: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  allDay: boolean;
  imageUrl: string | null;
};

type EventFormProps = {
  values: EventFormValues;
  timezoneLabel: string;
  isEditing: boolean;
  churchId: string;
  onChange: (patch: Partial<EventFormValues>) => void;
  onSubmit: () => void;
  onCancelEdit: () => void;
  onTemplateSelect: (template: EventTemplate) => void;
  error?: string | null;
};

// ── shared helpers ────────────────────────────────────────────────────────────
function parseLocalDate(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}
function toYmd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const todayYmd = toYmd(new Date());

function formatTime(value: string): string {
  if (!value) return "";
  const [hStr, mStr] = value.split(":");
  const h = parseInt(hStr ?? "0", 10);
  const m = parseInt(mStr ?? "0", 10);
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

const TIME_OPTIONS: { label: string; value: string }[] = (() => {
  const opts = [];
  for (let h = 5; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const h12 = h % 12 || 12;
      opts.push({
        label: `${h12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`,
        value: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
      });
    }
  }
  return opts;
})();

// ── inline calendar ───────────────────────────────────────────────────────────
function DatePicker({ value, onChange, placeholder = "Pick a date", disabled }: { value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [calMonth, setCalMonth] = useState(() => (value || todayYmd).slice(0, 7) + "-01");
  const ref = useRef<HTMLButtonElement>(null);

  const firstOfMonth = parseLocalDate(calMonth);
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());
  const days = Array.from({ length: 42 }, (_, i) => { const d = new Date(gridStart); d.setDate(gridStart.getDate() + i); return toYmd(d); });

  const display = value ? format(parseLocalDate(value), "MMM d, yyyy") : placeholder;

  return (
    <>
      <button ref={ref} type="button" disabled={disabled}
        onClick={() => { setCalMonth((value || todayYmd).slice(0, 7) + "-01"); setOpen(o => !o); }}
        className="flex w-full items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--surface)] focus:outline-none disabled:opacity-50"
      >
        <CalIcon className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
        <span className={value ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}>{display}</span>
      </button>
      {open && createPortal(
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-[300px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <button type="button" onClick={() => { const d = parseLocalDate(calMonth); d.setMonth(d.getMonth()-1); setCalMonth(toYmd(d).slice(0,7)+"-01"); }} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--surface-2)] text-[var(--text-secondary)]">‹</button>
              <span className="text-sm font-semibold text-[var(--text-primary)]">{format(parseLocalDate(calMonth), "MMMM yyyy")}</span>
              <button type="button" onClick={() => { const d = parseLocalDate(calMonth); d.setMonth(d.getMonth()+1); setCalMonth(toYmd(d).slice(0,7)+"-01"); }} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--surface-2)] text-[var(--text-secondary)]">›</button>
            </div>
            <div className="p-3">
              <div className="mb-1 grid grid-cols-7">{["Su","Mo","Tu","We","Th","Fr","Sa"].map(w => <span key={w} className="flex h-6 items-center justify-center text-[10px] font-semibold text-[var(--text-muted)]">{w}</span>)}</div>
              <div className="grid grid-cols-7 gap-0.5">
                {days.map(ymd => {
                  const inMonth = ymd.slice(0,7) === calMonth.slice(0,7);
                  const isSelected = ymd === value;
                  const isToday = ymd === todayYmd;
                  return (
                    <button key={ymd} type="button" onClick={() => { onChange(ymd); setOpen(false); }}
                      className={`flex h-8 w-full items-center justify-center rounded-lg text-sm transition-colors ${isSelected ? "bg-amber-500 font-semibold text-white" : inMonth ? "text-[var(--text-primary)] hover:bg-[var(--surface-2)]" : "text-[var(--text-muted)] opacity-40"} ${!isSelected && isToday ? "ring-1 ring-inset ring-amber-400" : ""}`}
                    >{parseLocalDate(ymd).getDate()}</button>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-between border-t border-[var(--border)] px-4 py-2">
              <button type="button" onClick={() => { onChange(todayYmd); setOpen(false); }} className="text-sm font-medium text-amber-600 hover:text-amber-800">Today</button>
              <button type="button" onClick={() => setOpen(false)} className="text-sm text-[var(--text-muted)]">Close</button>
            </div>
          </div>
        </div>, document.body
      )}
    </>
  );
}

// ── time picker ───────────────────────────────────────────────────────────────
function TimePicker({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
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

  return (
    <div className="relative">
      <button ref={btnRef} type="button" disabled={disabled} onClick={handleToggle}
        className="flex w-full items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--surface)] focus:outline-none disabled:opacity-50"
      >
        <Clock className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
        <span className={value ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}>
          {value ? formatTime(value) : "Set time"}
        </span>
        <ChevronDown className={`ml-auto h-3.5 w-3.5 text-[var(--text-muted)] transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && anchor && typeof document !== "undefined" && createPortal(
        <ul
          ref={listRef}
          style={{ position: "fixed", left: anchor.left, top: anchor.top, width: 144 }}
          className="z-[1001] max-h-56 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-lg"
        >
          {TIME_OPTIONS.map((opt) => {
            const active = opt.value === value;
            return (
              <li key={opt.value} className="list-none" data-active={String(active)}>
                <button type="button" onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`flex w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${active ? "bg-amber-500 font-semibold text-white" : "text-[var(--text-primary)] hover:bg-[var(--surface-2)]"}`}
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

// ── audience select ───────────────────────────────────────────────────────────
const AUDIENCE_OPTIONS = [
  { value: "ALL",     label: "All Members",   desc: "Visible to everyone" },
  { value: "MEMBER",  label: "Members",        desc: "Members + service team" },
  { value: "SERVICE", label: "Service Team",   desc: "Service team + admins" },
  { value: "ADMIN",   label: "Admins only",    desc: "Admins only" },
];

function AudienceSelect({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = AUDIENCE_OPTIONS.find(o => o.value === value) ?? AUDIENCE_OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button type="button" disabled={disabled} onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface)] focus:outline-none disabled:opacity-50"
      >
        <div className="flex items-center gap-2"><Users className="h-4 w-4 shrink-0 text-[var(--text-muted)]" /><span>{selected!.label}</span></div>
        <ChevronDown className={`h-3.5 w-3.5 text-[var(--text-muted)] transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul className="absolute left-0 top-full z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-lg">
          {AUDIENCE_OPTIONS.map(opt => (
            <li key={opt.value} className="list-none">
              <button type="button" onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`flex w-full flex-col rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--surface-2)] ${opt.value === value ? "bg-amber-50" : ""}`}
              >
                <span className={`text-sm font-semibold ${opt.value === value ? "text-amber-700" : "text-[var(--text-primary)]"}`}>{opt.label}</span>
                <span className="text-xs text-[var(--text-muted)]">{opt.desc}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── main form ─────────────────────────────────────────────────────────────────
export default function EventForm({ values, timezoneLabel, isEditing, churchId, onChange, onSubmit, onCancelEdit, onTemplateSelect, error }: EventFormProps) {
  const canSubmit = Boolean(values.title.trim()) && Boolean(values.startDate) && (values.allDay || Boolean(values.startTime));

  return (
    <div className="flex flex-col gap-5 p-6">
      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Event name</label>
        <input type="text" placeholder="What's happening?" value={values.title}
          onChange={e => onChange({ title: e.target.value })}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-base font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100"
        />
      </div>

      {/* All-day toggle */}
      <label className="flex cursor-pointer items-center gap-3">
        <div className={`relative h-5 w-9 rounded-full transition-colors ${values.allDay ? "bg-amber-500" : "bg-[var(--border)]"}`}>
          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${values.allDay ? "left-4.5 translate-x-0.5" : "left-0.5"}`} />
        </div>
        <span className="text-sm font-medium text-[var(--text-primary)]">All-day event</span>
        <input type="checkbox" className="sr-only" checked={values.allDay} onChange={e => onChange({ allDay: e.target.checked })} />
      </label>

      {/* Start */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Starts</label>
        <div className={`grid gap-2 ${values.allDay ? "" : "sm:grid-cols-2"}`}>
          <DatePicker value={values.startDate} onChange={v => onChange({ startDate: v })} placeholder="Start date" />
          {!values.allDay && <TimePicker value={values.startTime} onChange={v => onChange({ startTime: v })} />}
        </div>
      </div>

      {/* End */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Ends <span className="font-normal normal-case text-[var(--text-muted)]">(optional)</span></label>
        <div className={`grid gap-2 ${values.allDay ? "" : "sm:grid-cols-2"}`}>
          <DatePicker value={values.endDate} onChange={v => onChange({ endDate: v })} placeholder="End date" />
          {!values.allDay && <TimePicker value={values.endTime} onChange={v => onChange({ endTime: v })} />}
        </div>
      </div>

      {/* Location */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Location <span className="font-normal normal-case text-[var(--text-muted)]">(optional)</span></label>
        <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5">
          <MapPin className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
          <input type="text" placeholder="Where is this?" value={values.location}
            onChange={e => onChange({ location: e.target.value })}
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Description <span className="font-normal normal-case text-[var(--text-muted)]">(optional)</span></label>
        <textarea rows={3} placeholder="Give people the details they need…" value={values.description}
          onChange={e => onChange({ description: e.target.value })}
          className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100"
        />
      </div>

      {/* Image */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Event image</label>
          <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">Optional</span>
        </div>
        <ImageUpload value={values.imageUrl} churchId={churchId} onChange={url => onChange({ imageUrl: url })} />
      </div>

      {/* Audience */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Audience</label>
        <AudienceSelect value={values.audience} onChange={v => onChange({ audience: v })} />
      </div>

      {timezoneLabel && (
        <p className="text-xs text-[var(--text-muted)]">Times are in {timezoneLabel}.</p>
      )}

      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
        {isEditing ? (
          <button type="button" onClick={onCancelEdit} className="text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]">Cancel</button>
        ) : <span />}
        <button type="button" onClick={onSubmit} disabled={!canSubmit} className="btn btn-primary-gradient">
          {isEditing ? "Update event" : "Create event"}
        </button>
      </div>

      {/* Templates */}
      <div className="space-y-2 border-t border-[var(--border)] pt-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Quick templates</p>
        <EventTemplates onSelect={onTemplateSelect} />
      </div>
    </div>
  );
}
