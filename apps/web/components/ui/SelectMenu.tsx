"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";

export type SelectOption = {
  value: string;
  label: string;
  /** Secondary text shown right of the label (e.g. an email). */
  hint?: string;
  tone?: "default" | "success" | "info" | "warning" | "danger";
};

const TONE_DOT: Record<NonNullable<SelectOption["tone"]>, string> = {
  default: "bg-[var(--text-muted)]",
  success: "bg-emerald-500",
  info: "bg-blue-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
};

const MENU_MAX_H = 260;

/**
 * Styled dropdown used everywhere a native <select> would otherwise appear.
 * Native selects cannot be themed and render an OS-drawn popup that breaks the
 * visual language of the app.
 */
export default function SelectMenu({
  value,
  onChange,
  options,
  placeholder = "Select…",
  searchable = false,
  size = "md",
  className = "",
  buttonClassName = "",
  ariaLabel,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  searchable?: boolean;
  size?: "sm" | "md";
  className?: string;
  buttonClassName?: string;
  ariaLabel?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => setMounted(true), []);

  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || (o.hint ?? "").toLowerCase().includes(q)
    );
  }, [options, query, searchable]);

  // The menu renders through a portal on document.body so that no ancestor
  // with `overflow: hidden` (role cards, scroll panes, tables) can clip it.
  // That trade means positioning it by hand against the trigger.
  const place = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const h = menuRef.current?.offsetHeight ?? MENU_MAX_H;
    const spaceBelow = window.innerHeight - r.bottom;
    const flip = spaceBelow < h + 8 && r.top > spaceBelow;
    const width = Math.max(r.width, 180);
    setPos({
      top: flip ? Math.max(8, r.top - h - 4) : r.bottom + 4,
      left: Math.min(Math.max(8, r.left), window.innerWidth - width - 8),
      width,
    });
  }, []);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place, filtered.length]);

  useEffect(() => {
    if (!open) return;
    const onMove = () => place();
    // Capture phase so the menu also follows any nested scroll container.
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open, place]);

  // Close on outside click. The menu sits outside the trigger's DOM subtree,
  // so both nodes have to be checked.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    setActiveIndex(Math.max(0, options.findIndex((o) => o.value === value)));
    if (searchable) requestAnimationFrame(() => searchRef.current?.focus());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    (listRef.current.children[activeIndex] as HTMLElement | undefined)?.scrollIntoView({
      block: "nearest",
    });
  }, [activeIndex, open]);

  const commit = (v: string) => {
    onChange(v);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = filtered[activeIndex];
      if (opt) commit(opt.value);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  const h = size === "sm" ? "h-8" : "h-9";
  const text = size === "sm" ? "text-xs" : "text-sm";

  const menu =
    open && pos ? (
      <div
        ref={menuRef}
        onKeyDown={onKeyDown}
        style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width, zIndex: 1000 }}
        className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg"
      >
        {searchable && (
          <div className="flex items-center gap-1.5 border-b border-[var(--border)] px-2.5 py-1.5">
            <Search className="h-3.5 w-3.5 shrink-0 opacity-40" aria-hidden />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              placeholder="Search…"
              className="w-full border-0 bg-transparent p-0 text-xs text-[var(--text-primary)] outline-none ring-0 placeholder:text-[var(--text-muted)] focus:ring-0"
            />
          </div>
        )}
        <ul
          ref={listRef}
          role="listbox"
          className="list-none overflow-y-auto p-1"
          style={{ maxHeight: MENU_MAX_H - (searchable ? 34 : 0) }}
        >
          {filtered.length === 0 && (
            <li className="px-2.5 py-2 text-xs text-[var(--text-muted)]">No matches</li>
          )}
          {filtered.map((o, i) => {
            const isSel = o.value === value;
            return (
              <li
                key={o.value}
                role="option"
                aria-selected={isSel}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => commit(o.value)}
                className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs transition-colors ${
                  i === activeIndex ? "bg-[var(--surface-2)]" : ""
                } ${isSel ? "font-semibold text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}
              >
                {o.tone && (
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${TONE_DOT[o.tone]}`} aria-hidden />
                )}
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                {o.hint && <span className="shrink-0 text-[10px] text-[var(--text-muted)]">{o.hint}</span>}
                {isSel && <Check className="h-3 w-3 shrink-0 text-[var(--primary)]" aria-hidden />}
              </li>
            );
          })}
        </ul>
      </div>
    ) : null;

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onKeyDown={onKeyDown}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`flex ${h} w-full items-center justify-between gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 ${text} text-[var(--text-primary)] transition-colors hover:border-[var(--outline-variant)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-soft)] disabled:opacity-50 ${buttonClassName}`}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          {selected?.tone && (
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${TONE_DOT[selected.tone]}`} aria-hidden />
          )}
          <span className={`truncate ${selected ? "" : "text-[var(--text-muted)]"}`}>
            {selected?.label ?? placeholder}
          </span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 opacity-40 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {mounted && menu ? createPortal(menu, document.body) : null}
    </div>
  );
}
