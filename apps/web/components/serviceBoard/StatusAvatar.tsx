"use client";

import { forwardRef } from "react";
import type React from "react";
import { Plus } from "lucide-react";
import Avatar from "../ui/avatar";

export type SlotStatus = "OPEN" | "ASSIGNED" | "CONFIRMED" | "DECLINED";

const RING: Record<SlotStatus, string> = {
  CONFIRMED: "ring-emerald-500",
  ASSIGNED: "ring-amber-400",
  DECLINED: "ring-red-500",
  OPEN: "ring-transparent",
};

export const STATUS_WORD: Record<SlotStatus, string> = {
  CONFIRMED: "confirmed",
  ASSIGNED: "waiting for a reply",
  DECLINED: "declined",
  OPEN: "open",
};

type PersonLite = { name: string; email?: string | null; avatarUrl?: string | null };

/**
 * A person on the plan. The ring is their answer (green confirmed, amber
 * waiting, red declined) — status is never a dropdown. A small badge shows
 * the backup when there is one.
 */
export const StatusAvatar = forwardRef<
  HTMLButtonElement,
  {
    person: PersonLite;
    status: SlotStatus;
    backup?: PersonLite | null;
    size?: number;
    label: string;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  }
>(function StatusAvatar({ person, status, backup, size = 30, label, onClick }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`relative shrink-0 rounded-full ring-2 ring-offset-2 ring-offset-[var(--surface)] transition hover:-translate-y-0.5 ${RING[status]}`}
      style={{ width: size, height: size }}
    >
      <Avatar
        name={person.name}
        email={person.email ?? ""}
        imageUrl={person.avatarUrl ?? null}
        size={size}
        className="bg-amber-100 text-[10px] font-bold text-amber-800"
      />
      {backup ? <BackupBadge person={backup} /> : null}
    </button>
  );
});

/**
 * Tiny backup marker on the avatar's corner: their photo, or one initial —
 * two letters can't fit 16px. A white edge separates it from the main avatar.
 */
function BackupBadge({ person }: { person: PersonLite }) {
  const initial = (person.name.trim()[0] ?? person.email?.[0] ?? "?").toUpperCase();
  return (
    <span
      aria-hidden
      className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-[8px] font-bold leading-none text-emerald-800 shadow-[0_0_0_2px_var(--surface)]"
    >
      {person.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- 16px Supabase avatar
        <img src={person.avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        initial
      )}
    </span>
  );
}

/** The empty seat: dashed "+" that opens the people picker. */
export const EmptySeat = forwardRef<HTMLButtonElement, { label: string; onClick: (e: React.MouseEvent<HTMLButtonElement>) => void; size?: number }>(
  function EmptySeat({ label, onClick, size = 30 }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        aria-label={label}
        title={label}
        className="flex shrink-0 items-center justify-center rounded-full border-[1.5px] border-dashed border-[var(--outline-variant)] text-[var(--text-muted)] transition hover:-translate-y-0.5 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
        style={{ width: size, height: size }}
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
      </button>
    );
  }
);
