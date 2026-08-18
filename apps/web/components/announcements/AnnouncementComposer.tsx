"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Calendar, Clock, Users, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import ImageUpload from "./ImageUpload";
import AnnouncementTemplates, { type AnnouncementTemplate } from "./AnnouncementTemplates";
import { formatShortWeekdayDateTime } from "../../lib/format";

type PublishMode = "NOW" | "SCHEDULE";

type AnnouncementComposerProps = {
  title: string;
  body: string;
  audience: string;
  publishMode: PublishMode;
  scheduleDate: string;
  scheduleTime: string;
  timezoneLabel: string;
  previewMode: "EDIT" | "PREVIEW";
  isEditing: boolean;
  isSubmitting?: boolean;
  submitVariant?: "publish" | "draft" | null;
  imageUrl: string | null;
  churchId: string;
  onTitleChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onAudienceChange: (value: string) => void;
  onPublishModeChange: (mode: PublishMode) => void;
  onScheduleDateChange: (value: string) => void;
  onScheduleTimeChange: (value: string) => void;
  onPreviewModeChange: (value: "EDIT" | "PREVIEW") => void;
  onImageUrlChange: (url: string | null) => void;
  onPrimary: () => void;
  onSaveDraft: () => void;
  onCancelEdit: () => void;
  onTemplateSelect: (template: AnnouncementTemplate) => void;
};

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

const AUDIENCE_OPTIONS = [
  { value: "ALL",     label: "All Members",   desc: "Everyone in the church" },
  { value: "MEMBER",  label: "Members",        desc: "Members + service team" },
  { value: "SERVICE", label: "Service Team",   desc: "Service team + admins" },
  { value: "ADMIN",   label: "Admins only",    desc: "Admins only" },
];

function AudienceSelect({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = AUDIENCE_OPTIONS.find((o) => o.value === value) ?? AUDIENCE_OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface)] focus:outline-none disabled:opacity-50"
      >
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
          <span>{selected!.label}</span>
        </div>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-[var(--text-muted)] transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && createPortal(
        <div className="fixed inset-0 z-[1100]" onClick={() => setOpen(false)}>
          <ul
            className="absolute overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-xl"
            style={(() => {
              const rect = ref.current?.getBoundingClientRect();
              return rect ? { top: rect.bottom + 4, left: rect.left, width: rect.width } : {};
            })()}
            onClick={(e) => e.stopPropagation()}
          >
            {AUDIENCE_OPTIONS.map((opt) => (
              <li key={opt.value} className="list-none">
                <button
                  type="button"
                  className={`flex w-full flex-col rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-2)] ${opt.value === value ? "bg-amber-50" : ""}`}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                >
                  <span className={`text-sm font-semibold ${opt.value === value ? "text-amber-700" : "text-[var(--text-primary)]"}`}>{opt.label}</span>
                  <span className="text-xs text-[var(--text-muted)]">{opt.desc}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>,
        document.body
      )}
    </div>
  );
}

function parseLocalDate(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}
function toYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function InlineDatePicker({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [calMonth, setCalMonth] = useState(() => (value || toYmd(new Date())).slice(0, 7) + "-01");
  const ref = useRef<HTMLButtonElement>(null);
  const todayYmd = toYmd(new Date());
  const displayLabel = value ? format(parseLocalDate(value), "MMM d, yyyy") : "Pick a date";

  const firstOfMonth = parseLocalDate(calMonth);
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());
  const days = Array.from({ length: 42 }, (_, i) => { const d = new Date(gridStart); d.setDate(gridStart.getDate() + i); return toYmd(d); });

  return (
    <>
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        onClick={() => { setCalMonth((value || todayYmd).slice(0, 7) + "-01"); setOpen((o) => !o); }}
        className="flex w-full items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface)] focus:outline-none disabled:opacity-50"
      >
        <Calendar className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
        <span className={value ? "" : "text-[var(--text-muted)]"}>{displayLabel}</span>
      </button>
      {open && createPortal(
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-[320px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <button type="button" onClick={() => { const d = parseLocalDate(calMonth); d.setMonth(d.getMonth()-1); setCalMonth(toYmd(d).slice(0,7)+"-01"); }} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--surface-2)]">‹</button>
              <span className="text-sm font-semibold">{format(parseLocalDate(calMonth), "MMMM yyyy")}</span>
              <button type="button" onClick={() => { const d = parseLocalDate(calMonth); d.setMonth(d.getMonth()+1); setCalMonth(toYmd(d).slice(0,7)+"-01"); }} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--surface-2)]">›</button>
            </div>
            <div className="p-3">
              <div className="mb-1 grid grid-cols-7">{["Su","Mo","Tu","We","Th","Fr","Sa"].map((w)=><span key={w} className="flex h-7 items-center justify-center text-[10px] font-semibold text-[var(--text-muted)]">{w}</span>)}</div>
              <div className="grid grid-cols-7 gap-0.5">
                {days.map((ymd) => {
                  const inMonth = ymd.slice(0,7) === calMonth.slice(0,7);
                  const isSelected = ymd === value;
                  const isToday = ymd === todayYmd;
                  return (
                    <button key={ymd} type="button" onClick={() => { onChange(ymd); setOpen(false); }}
                      className={`flex h-9 w-full items-center justify-center rounded-xl text-sm transition-colors ${isSelected ? "bg-amber-500 font-semibold text-white" : inMonth ? "text-[var(--text-primary)] hover:bg-[var(--surface-2)]" : "text-[var(--text-muted)] opacity-40"} ${!isSelected && isToday ? "ring-1 ring-inset ring-amber-400" : ""}`}
                    >
                      {parseLocalDate(ymd).getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-between border-t border-[var(--border)] px-4 py-2.5">
              <button type="button" onClick={() => { onChange(todayYmd); setOpen(false); }} className="text-sm font-medium text-amber-600 hover:text-amber-800">Today</button>
              <button type="button" onClick={() => setOpen(false)} className="text-sm text-[var(--text-muted)]">Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function ButtonSpinner() {
  return <span className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />;
}

// Lightweight phone-frame preview
function AnnouncementPhonePreview({ title, body, audience, imageUrl }: { title: string; body: string; audience: string; imageUrl: string | null }) {
  const audienceLabel = AUDIENCE_OPTIONS.find((o) => o.value === audience)?.label ?? audience;
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-0 py-6">
      <div className="w-[240px]">
        <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Preview</p>
        {/* Phone frame */}
        <div className="overflow-hidden rounded-[2rem] border-[6px] border-slate-800 bg-white shadow-2xl">
          {/* Status bar */}
          <div className="flex items-center justify-between bg-slate-800 px-4 py-1.5">
            <span className="text-[9px] font-semibold text-white">9:41</span>
            <div className="flex gap-1">
              <span className="text-[9px] text-white">●●●</span>
            </div>
          </div>
          {/* Notification / card */}
          <div className="bg-[#f2f2f7] p-3 space-y-2">
            <div className="overflow-hidden rounded-xl bg-white shadow-sm">
              {imageUrl && (
                <img src={imageUrl} alt="" className="h-28 w-full object-cover" />
              )}
              <div className="p-3 space-y-1">
                <div className="flex items-center gap-1.5">
                  <div className="h-4 w-4 rounded-full bg-amber-400" />
                  <span className="text-[9px] font-bold uppercase text-amber-700">Gather · {audienceLabel}</span>
                </div>
                <p className="text-[11px] font-bold leading-tight text-gray-900">
                  {title || <span className="text-gray-400">Your headline…</span>}
                </p>
                <p className="line-clamp-3 text-[9px] leading-relaxed text-gray-500">
                  {body || <span>Your message body will appear here.</span>}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnnouncementComposer({
  title, body, audience, publishMode, scheduleDate, scheduleTime,
  timezoneLabel, isEditing, isSubmitting = false, submitVariant = null,
  imageUrl, churchId,
  onTitleChange, onBodyChange, onAudienceChange, onPublishModeChange,
  onScheduleDateChange, onScheduleTimeChange, onImageUrlChange,
  onPrimary, onSaveDraft, onCancelEdit, onTemplateSelect,
}: AnnouncementComposerProps) {
  const hasContent = title.trim().length > 0 && body.trim().length > 0;
  const scheduleReady = scheduleDate && scheduleTime;
  const canPrimary = hasContent && (publishMode === "NOW" || scheduleReady) && !isSubmitting;
  const bodyLength = body.length;

  const scheduleLabel = useMemo(() => {
    if (!scheduleReady) return "";
    const date = new Date(`${scheduleDate}T${scheduleTime}`);
    if (Number.isNaN(date.getTime())) return "";
    return formatShortWeekdayDateTime(date) + (timezoneLabel ? ` (${timezoneLabel})` : "");
  }, [scheduleDate, scheduleTime, timezoneLabel, scheduleReady]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Two-panel body */}
      <div className="flex min-h-0 flex-1 divide-x divide-[var(--border)]">
        {/* Left: form */}
        <div className="flex w-full flex-col gap-5 overflow-y-auto p-6 md:w-3/5">
          {/* Headline */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Headline</label>
            <input
              type="text"
              placeholder="Something your community needs to know…"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-base font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100"
            />
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Message</label>
              <span className={`text-[11px] tabular-nums ${bodyLength > 320 ? "text-amber-600" : "text-[var(--text-muted)]"}`}>
                {bodyLength} {bodyLength > 320 ? "· keep it concise" : ""}
              </span>
            </div>
            <textarea
              placeholder="Share your message, update, or encouragement…"
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
              disabled={isSubmitting}
              rows={5}
              className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100"
            />
          </div>

          {/* Image */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Banner image</label>
              <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">Optional</span>
            </div>
            <ImageUpload value={imageUrl} churchId={churchId} onChange={onImageUrlChange} disabled={isSubmitting} />
          </div>

          {/* Audience */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Audience</label>
            <AudienceSelect value={audience} onChange={onAudienceChange} disabled={isSubmitting} />
          </div>

          {/* Schedule */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Publish</label>
            {publishMode === "SCHEDULE" ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <InlineDatePicker value={scheduleDate} onChange={onScheduleDateChange} disabled={isSubmitting} />
                  <TimePicker value={scheduleTime} onChange={onScheduleTimeChange} disabled={isSubmitting} />
                </div>
                {scheduleLabel && (
                  <p className="text-xs text-[var(--text-muted)]">Publishes {scheduleLabel}</p>
                )}
                <button type="button" onClick={() => onPublishModeChange("NOW")} disabled={isSubmitting}
                  className="text-xs font-medium text-amber-600 transition-colors hover:text-amber-800">
                  ← Publish immediately instead
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5">
                <span className="text-sm font-medium text-[var(--text-primary)]">Immediately</span>
                <button type="button" onClick={() => onPublishModeChange("SCHEDULE")} disabled={isSubmitting}
                  className="text-xs font-medium text-amber-600 transition-colors hover:text-amber-800">
                  Schedule for later →
                </button>
              </div>
            )}
          </div>

          {/* Templates */}
          <div className="space-y-2 border-t border-[var(--border)] pt-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Templates</p>
            <AnnouncementTemplates onSelect={onTemplateSelect} />
          </div>
        </div>

        {/* Right: live preview (hidden on mobile) */}
        <div className="hidden flex-col bg-[var(--surface-container-low)] md:flex md:w-2/5">
          <AnnouncementPhonePreview title={title} body={body} audience={audience} imageUrl={imageUrl} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] bg-[var(--surface)] px-6 py-4">
        <button type="button" onClick={onCancelEdit} className="text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]">
          Cancel
        </button>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onSaveDraft} disabled={!hasContent || isSubmitting}
            className="btn btn-secondary btn-sm flex items-center gap-2">
            {isSubmitting && submitVariant === "draft" ? <ButtonSpinner /> : null}
            Save draft
          </button>
          <button type="button" onClick={onPrimary} disabled={!canPrimary}
            className="btn btn-primary-gradient btn-sm flex items-center gap-2">
            {isSubmitting && submitVariant === "publish" ? <ButtonSpinner /> : null}
            {publishMode === "NOW" ? "Publish now" : "Schedule post"}
          </button>
        </div>
      </div>
    </div>
  );
}
