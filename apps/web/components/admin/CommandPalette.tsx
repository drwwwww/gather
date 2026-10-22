"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ArrowRight, Calendar, ClipboardList, CornerDownLeft, Loader2, Megaphone, Search, User } from "lucide-react";
import type { ElementType } from "react";
import { supabase } from "../../lib/supabaseClient";

export type PaletteDestination = { href: string; label: string; icon: ElementType };

type Result = { key: string; group: string; label: string; sub?: string; href: string; icon: ElementType };

const formatDay = (value: string) =>
  new Date(value.length === 10 ? `${value}T12:00:00` : value).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

/**
 * ⌘K search: one centered panel for pages and church data. The sidebar's
 * Search row is only the button that opens it — a 200px column is too narrow
 * to type into, so the results get room here (Linear's pattern).
 */
export default function CommandPalette({
  open,
  onClose,
  churchId,
  destinations,
}: {
  open: boolean;
  onClose: () => void;
  churchId: string | null;
  destinations: PaletteDestination[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [query, setQuery] = useState("");
  const [data, setData] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setData([]);
    setActive(0);
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  // Church data, debounced.
  useEffect(() => {
    const q = query.trim();
    if (!open || !supabase || !churchId || q.length < 2) {
      setData([]);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    const t = window.setTimeout(async () => {
      const like = `%${q.replace(/[%_,()]/g, " ")}%`;
      const db = supabase as any;
      const [people, plans, events, posts] = await Promise.all([
        db.from("profiles").select("id, full_name, email, role").eq("church_id", churchId)
          .or(`full_name.ilike.${like},email.ilike.${like}`).order("full_name").limit(5),
        db.from("service_plans").select("id, title, service_date").eq("church_id", churchId)
          .ilike("title", like).order("service_date", { ascending: false }).limit(4),
        db.from("events").select("id, title, start_at").eq("church_id", churchId)
          .ilike("title", like).order("start_at", { ascending: false }).limit(4),
        db.from("announcements").select("id, title, publish_at, created_at").eq("church_id", churchId)
          .ilike("title", like).order("created_at", { ascending: false }).limit(4),
      ]);
      if (!alive) return;
      const roleWord: Record<string, string> = { ADMIN: "Admin", SERVICE: "Service team", MEMBER: "Member" };
      setData([
        ...(people.data ?? []).map((p: any) => ({
          key: `p-${p.id}`, group: "People", icon: User, href: `/people?member=${p.id}`,
          label: p.full_name?.trim() || p.email || "Member", sub: [roleWord[p.role], p.email].filter(Boolean).join(" · "),
        })),
        ...(plans.data ?? []).map((p: any) => ({
          key: `s-${p.id}`, group: "Service plans", icon: ClipboardList, href: `/admin/service-plans/${p.id}`,
          label: p.title || "Service", sub: formatDay(p.service_date),
        })),
        ...(events.data ?? []).map((e: any) => ({
          key: `e-${e.id}`, group: "Events", icon: Calendar, href: `/events?open=${e.id}`,
          label: e.title, sub: formatDay(e.start_at),
        })),
        ...(posts.data ?? []).map((a: any) => ({
          key: `a-${a.id}`, group: "Announcements", icon: Megaphone, href: `/announcements?open=${a.id}`,
          label: a.title, sub: formatDay(a.publish_at ?? a.created_at),
        })),
      ]);
      setLoading(false);
    }, 200);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [query, open, churchId]);

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    const pages = destinations
      .filter((d) => !q || d.label.toLowerCase().includes(q))
      .map((d) => ({ key: `go-${d.href}`, group: "Go to", label: d.label, href: d.href, icon: d.icon }));
    return [...pages, ...data];
  }, [query, data, destinations]);

  useEffect(() => setActive(0), [query, data.length]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open || typeof document === "undefined") return null;

  const go = (href: string) => {
    onClose();
    router.push(href);
  };
  const seeAll = () => {
    const q = query.trim();
    if (q) go(`/admin/search?q=${encodeURIComponent(q)}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); onClose(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0))); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      const hit = results[active];
      if (hit) go(hit.href);
      else seeAll();
    }
  };

  let lastGroup = "";
  const trimmed = query.trim();

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-start justify-center bg-black/30 px-4 pt-[12vh]" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
        className="flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_24px_60px_-20px_rgba(40,30,10,0.45)]"
      >
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4">
          <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)]" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people, plans, events, or pages…"
            aria-label="Search"
            aria-controls="palette-results"
            aria-activedescendant={results[active] ? `palette-${results[active].key}` : undefined}
            className="h-14 min-w-0 flex-1 border-0 bg-transparent text-[15px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:ring-0"
          />
          {loading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--text-muted)]" aria-hidden /> : null}
          <kbd className="shrink-0 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">Esc</kbd>
        </div>

        <ul id="palette-results" ref={listRef} role="listbox" className="m-0 min-h-0 flex-1 list-none overflow-y-auto p-2">
          {results.map((r, i) => {
            const header = r.group !== lastGroup ? r.group : null;
            lastGroup = r.group;
            const Icon = r.icon;
            const isActive = i === active;
            return (
              <li key={r.key} className="list-none">
                {header ? (
                  <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] first:pt-1">{header}</p>
                ) : null}
                <button
                  type="button"
                  id={`palette-${r.key}`}
                  role="option"
                  aria-selected={isActive}
                  data-index={i}
                  onMouseMove={() => setActive(i)}
                  onClick={() => go(r.href)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${isActive ? "bg-[var(--surface-2)]" : ""}`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isActive ? "bg-amber-100 text-amber-700" : "bg-[var(--surface-2)] text-[var(--text-muted)]"}`}>
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[var(--text-primary)]">{r.label}</span>
                    {r.sub ? <span className="block truncate text-xs text-[var(--text-muted)]">{r.sub}</span> : null}
                  </span>
                  {isActive ? <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" aria-hidden /> : null}
                </button>
              </li>
            );
          })}
          {trimmed.length >= 2 && !loading && data.length === 0 ? (
            <li className="list-none px-3 py-6 text-center text-sm text-[var(--text-muted)]">No people, plans, events, or posts match “{trimmed}”.</li>
          ) : null}
        </ul>

        {trimmed ? (
          <button
            type="button"
            onClick={seeAll}
            className="flex items-center justify-between border-t border-[var(--border)] px-4 py-2.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]"
          >
            <span>See all results for “{trimmed}”</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        ) : (
          <p className="border-t border-[var(--border)] px-4 py-2.5 text-xs text-[var(--text-muted)]">↑ ↓ to move · Enter to open · Esc to close</p>
        )}
      </div>
    </div>,
    document.body
  );
}
