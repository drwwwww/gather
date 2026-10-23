"use client";

import { useEffect, useState, type ComponentType } from "react";
import { Pin, Plus, Star, Trash2 } from "lucide-react";
import SelectMenu, { type SelectOption } from "../ui/SelectMenu";
import { supabase } from "../../lib/supabaseClient";
import { KIND_META, type AnnouncementExtras, type AnnouncementKind, type InfoItem, type SlotDraft } from "../../lib/announcements";

const KINDS: AnnouncementKind[] = ["UPDATE", "EVENT", "SIGNUP", "PRAYER"];
const label = "text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]";
const input =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100";

/**
 * What kind of post this is, and the extras that make it useful in the app:
 * a linked event (RSVP), sign-up slots, who to ask, "Know before you go".
 */
export default function AnnouncementTypeFields({
  value,
  onChange,
  churchId,
  disabled,
  DatePicker,
}: {
  value: AnnouncementExtras;
  onChange: (next: AnnouncementExtras) => void;
  churchId: string;
  disabled?: boolean;
  DatePicker: ComponentType<{ value: string; onChange: (v: string) => void; disabled?: boolean }>;
}) {
  const [events, setEvents] = useState<SelectOption[]>([]);
  const [people, setPeople] = useState<SelectOption[]>([]);
  const set = (patch: Partial<AnnouncementExtras>) => onChange({ ...value, ...patch });

  useEffect(() => {
    if (!supabase || !churchId) return;
    let alive = true;
    const since = new Date(Date.now() - 86_400_000).toISOString();
    void Promise.all([
      supabase.from("events").select("id, title, start_at").eq("church_id", churchId).eq("is_cancelled", false).gte("start_at", since).order("start_at").limit(80),
      supabase.from("profiles").select("id, full_name, email, role").eq("church_id", churchId).eq("disabled", false).order("full_name"),
    ]).then(([ev, pp]) => {
      if (!alive) return;
      setEvents(((ev.data ?? []) as { id: string; title: string; start_at: string }[]).map((e) => ({
        value: e.id,
        label: e.title,
        hint: new Date(e.start_at).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
      })));
      setPeople(((pp.data ?? []) as { id: string; full_name: string | null; email: string | null; role: string }[]).map((p) => ({
        value: p.id,
        label: p.full_name?.trim() || p.email || "Member",
        hint: p.role === "ADMIN" ? "Admin" : p.role === "SERVICE" ? "Service team" : undefined,
      })));
    });
    return () => { alive = false; };
  }, [churchId]);

  const setSlot = (i: number, patch: Partial<SlotDraft>) => set({ slots: value.slots.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const removeSlot = (i: number) => {
    const s = value.slots[i];
    if (s.taken && !window.confirm(`${s.taken} ${s.taken === 1 ? "person has" : "people have"} signed up for "${s.label}". Remove it anyway?`)) return;
    set({ slots: value.slots.filter((_, j) => j !== i) });
  };
  const setInfo = (i: number, patch: Partial<InfoItem>) => set({ info: value.info.map((x, j) => (j === i ? { ...x, ...patch } : x)) });

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <span className={label} id="kind-label">What kind of post?</span>
        <div role="radiogroup" aria-labelledby="kind-label" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {KINDS.map((k) => {
            const active = value.kind === k;
            return (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={disabled}
                onClick={() => set({ kind: k, ...(k === "SIGNUP" && value.slots.length === 0 ? { slots: [{ label: "", detail: "", capacity: 1 }] } : {}) })}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                  active ? "border-[var(--text-primary)] bg-[var(--surface)] text-[var(--text-primary)]" : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface)]"
                }`}
              >
                <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: KIND_META[k].area.mark }} />
                {KIND_META[k].label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-[var(--text-muted)]">{KIND_META[value.kind].hint}</p>
      </div>

      {value.kind === "EVENT" ? (
        <div className="space-y-1.5">
          <span className={label}>Event</span>
          <SelectMenu
            value={value.eventId}
            onChange={(v) => set({ eventId: v })}
            options={events}
            searchable
            placeholder="Pick the event"
            emptyText="No upcoming events — add one on the Events page first"
            ariaLabel="Event"
            disabled={disabled}
          />
          <p className="text-xs text-[var(--text-muted)]">The app shows its date, place and an &ldquo;I&apos;m going&rdquo; button.</p>
        </div>
      ) : null}

      {value.kind === "SIGNUP" ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <span className={label}>Slots</span>
            <div className="space-y-2">
              {value.slots.map((s, i) => (
                <div key={s.id ?? `new-${i}`} className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_72px_36px] items-center gap-2">
                  <input aria-label={`Slot ${i + 1} name`} className={input} placeholder="Wed, Oct 28 dinner" value={s.label} maxLength={80} disabled={disabled} onChange={(e) => setSlot(i, { label: e.target.value })} />
                  <input aria-label={`Slot ${i + 1} detail`} className={input} placeholder="Drop off by 6 PM" value={s.detail} maxLength={160} disabled={disabled} onChange={(e) => setSlot(i, { detail: e.target.value })} />
                  <input aria-label={`Slot ${i + 1} spots`} className={input} type="number" min={1} max={500} value={s.capacity} disabled={disabled} onChange={(e) => setSlot(i, { capacity: Math.max(1, Number(e.target.value) || 1) })} />
                  <button type="button" aria-label={`Remove slot ${i + 1}`} onClick={() => removeSlot(i)} disabled={disabled} className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                  {s.taken ? <p className="col-span-4 -mt-1 text-xs text-[var(--text-muted)]">{s.taken} signed up</p> : null}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>Name · detail · spots</span>
              <button type="button" disabled={disabled || value.slots.length >= 60} onClick={() => set({ slots: [...value.slots, { label: "", detail: "", capacity: 1 }] })} className="inline-flex items-center gap-1 font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
                <Plus className="h-3.5 w-3.5" /> Add a slot
              </button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <span className={label}>Sign-ups close</span>
              <DatePicker value={value.closesDate} onChange={(v) => set({ closesDate: v })} disabled={disabled} />
            </div>
            <div className="space-y-1.5">
              <label className={label} htmlFor="private-note">Only for people who sign up</label>
              <textarea id="private-note" rows={2} className={`${input} resize-none`} placeholder="Address, door code, who to call" value={value.privateNote} maxLength={1000} disabled={disabled} onChange={(e) => set({ privateNote: e.target.value })} />
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-3 rounded-2xl border border-[var(--border)] p-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={value.pinned}
            disabled={disabled}
            onClick={() => set({ pinned: !value.pinned })}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${value.pinned ? "border-[var(--text-primary)] bg-[var(--surface)] text-[var(--text-primary)]" : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"}`}
          >
            <Pin className="h-3.5 w-3.5" /> Pin to the top
          </button>
          <button
            type="button"
            aria-pressed={value.important}
            disabled={disabled}
            onClick={() => set({ important: !value.important })}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${value.important ? "border-amber-400 bg-amber-50 text-amber-800" : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"}`}
          >
            <Star className="h-3.5 w-3.5" /> Mark important
          </button>
        </div>

        <div className="space-y-1.5">
          <span className={label}>Questions go to</span>
          <SelectMenu value={value.contactUserId} onChange={(v) => set({ contactUserId: v })} options={[{ value: "", label: "Nobody in particular" }, ...people]} searchable placeholder="Nobody in particular" ariaLabel="Contact person" disabled={disabled} />
        </div>

        <div className="space-y-1.5">
          <span className={label}>Know before you go</span>
          {value.info.map((it, i) => (
            <div key={i} className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)_36px] items-center gap-2">
              <input aria-label={`Detail ${i + 1} title`} className={input} placeholder="Parking" value={it.label} maxLength={40} disabled={disabled} onChange={(e) => setInfo(i, { label: e.target.value })} />
              <input aria-label={`Detail ${i + 1} text`} className={input} placeholder="Overflow lot on Lloyd St" value={it.text} maxLength={160} disabled={disabled} onChange={(e) => setInfo(i, { text: e.target.value })} />
              <button type="button" aria-label={`Remove detail ${i + 1}`} onClick={() => set({ info: value.info.filter((_, j) => j !== i) })} disabled={disabled} className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {value.info.length < 6 ? (
            <button type="button" disabled={disabled} onClick={() => set({ info: [...value.info, { label: "", text: "" }] })} className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
              <Plus className="h-3.5 w-3.5" /> Add a detail {value.info.length === 0 ? "(what to bring, childcare, parking)" : ""}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
