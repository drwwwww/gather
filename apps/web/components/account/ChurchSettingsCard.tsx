"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Copy, Search } from "lucide-react";

type TimezoneOption = { value: string; label: string };

function TimezoneCombobox({
  value,
  options,
  onChange,
}: {
  value: string;
  options: TimezoneOption[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  useEffect(() => {
    if (open) {
      setSearch("");
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  const filtered = options.filter(
    (o) =>
      o.label.toLowerCase().includes(search.toLowerCase()) ||
      o.value.toLowerCase().includes(search.toLowerCase())
  );
  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--surface)] focus:outline-none"
      >
        <span className="truncate">{selected?.label ?? value}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg">
          {/* Search input */}
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search timezones…"
              className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
            />
          </div>

          {/* Options list */}
          <ul className="max-h-52 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-xs text-[var(--text-muted)]">No matches</li>
            ) : (
              filtered.map((opt) => (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--surface-2)] ${
                      opt.value === value ? "bg-amber-50 text-amber-700" : "text-[var(--text-primary)]"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {opt.value === value && <Check className="h-3.5 w-3.5 text-amber-600" />}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function ChurchSettingsCard({
  churchName,
  joinCode,
  timezone,
  timezoneOptions,
  onChurchNameChange,
  onTimezoneChange,
  onSave,
  saveDisabled,
}: {
  churchName: string;
  joinCode: string;
  timezone: string;
  timezoneOptions: TimezoneOption[];
  onChurchNameChange: (v: string) => void;
  onTimezoneChange: (v: string) => void;
  onSave: () => void;
  saveDisabled: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <div>
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Church settings</h2>
        <p className="mt-0.5 text-sm text-[var(--text-muted)]">Update your church's name and timezone.</p>
      </div>

      <div className="space-y-4">
        {/* Church name */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
            Church name
          </label>
          <input
            type="text"
            placeholder="Church name"
            value={churchName}
            onChange={(e) => onChurchNameChange(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100"
          />
        </div>

        {/* Join code */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
            Join code
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={joinCode}
              readOnly
              className="flex-1 cursor-not-allowed rounded-xl border border-[var(--border)] bg-[var(--surface-container-low)] px-4 py-2.5 font-mono text-sm text-[var(--text-muted)]"
            />
            <button
              type="button"
              onClick={copyCode}
              className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-container-low)]"
            >
              <Copy className="h-4 w-4" />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Members enter this code in the Gather app to join your church.
          </p>
        </div>

        {/* Timezone — custom searchable combobox */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
            Timezone
          </label>
          <TimezoneCombobox value={timezone} options={timezoneOptions} onChange={onTimezoneChange} />
        </div>

        <div className="flex justify-end border-t border-[var(--border)] pt-4">
          <button
            type="button"
            onClick={onSave}
            disabled={saveDisabled}
            className="flex h-10 items-center rounded-xl bg-amber-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
