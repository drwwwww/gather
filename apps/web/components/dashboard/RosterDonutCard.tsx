"use client";

import Link from "next/link";
import { Users } from "lucide-react";

export type RosterMix = {
  open: number;
  assigned: number;
  confirmed: number;
  declined: number;
};

/** Display order: legend + clockwise stack from top. */
const SEGMENTS = [
  { key: "confirmed" as const, label: "Confirmed", fill: "var(--success, #22c55e)" },
  { key: "assigned" as const, label: "Awaiting reply", fill: "var(--info, #0ea5e9)" },
  { key: "open" as const, label: "Open slots", fill: "var(--warning, #f59e0b)" },
  { key: "declined" as const, label: "Declined", fill: "var(--danger, #ef4444)" },
] as const;

type SegmentKey = (typeof SEGMENTS)[number]["key"];

const SIZE = 240;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R_OUTER = 100;
const R_INNER = 56;
/** Angular gap between slices (degrees). */
const SLICE_GAP = 3;

/**
 * Annular sector from `startDeg` to `endDeg` (clockwise, 0° = top).
 * Uses SVG arc flags: outer arc clockwise, inner arc counter‑clockwise.
 */
function annularSector(startDeg: number, endDeg: number): string {
  if (endDeg - startDeg < 0.05) return "";

  const toRad = (clockDeg: number) => ((clockDeg - 90) * Math.PI) / 180;
  const sr = toRad(startDeg);
  const er = toRad(endDeg);

  const ox0 = CX + R_OUTER * Math.cos(sr);
  const oy0 = CY + R_OUTER * Math.sin(sr);
  const ox1 = CX + R_OUTER * Math.cos(er);
  const oy1 = CY + R_OUTER * Math.sin(er);
  const ix1 = CX + R_INNER * Math.cos(er);
  const iy1 = CY + R_INNER * Math.sin(er);
  const ix0 = CX + R_INNER * Math.cos(sr);
  const iy0 = CY + R_INNER * Math.sin(sr);

  const large = endDeg - startDeg > 180 ? 1 : 0;

  return [
    `M ${ox0.toFixed(2)} ${oy0.toFixed(2)}`,
    `A ${R_OUTER} ${R_OUTER} 0 ${large} 1 ${ox1.toFixed(2)} ${oy1.toFixed(2)}`,
    `L ${ix1.toFixed(2)} ${iy1.toFixed(2)}`,
    `A ${R_INNER} ${R_INNER} 0 ${large} 0 ${ix0.toFixed(2)} ${iy0.toFixed(2)}`,
    "Z",
  ].join(" ");
}

function buildSlices(mix: RosterMix): { key: SegmentKey; d: string; fill: string }[] {
  const active = SEGMENTS.filter((s) => mix[s.key] > 0);
  const total = SEGMENTS.reduce((acc, s) => acc + mix[s.key], 0);
  if (total === 0 || active.length === 0) return [];

  const usable = active.length <= 1 ? 360 : 360 - SLICE_GAP * active.length;
  let cursor = 0;
  const out: { key: SegmentKey; d: string; fill: string }[] = [];

  for (const s of active) {
    const span = (mix[s.key] / total) * usable;
    const d = annularSector(cursor, cursor + span);
    if (d) out.push({ key: s.key, d, fill: s.fill });
    cursor += span + (active.length <= 1 ? 0 : SLICE_GAP);
  }

  return out;
}

const STITCH_R = 80;
const STITCH_C = 2 * Math.PI * STITCH_R;

export default function RosterDonutCard({ mix, variant = "default" }: { mix: RosterMix; variant?: "default" | "stitch" }) {
  const total = SEGMENTS.reduce((acc, s) => acc + mix[s.key], 0);
  const slices = buildSlices(mix);
  const mid = (R_OUTER + R_INNER) / 2;

  if (variant === "stitch") {
    const filledPct = total > 0 ? Math.round(((total - mix.open) / total) * 100) : 0;
    const dashOffset = STITCH_C * (1 - filledPct / 100);

    if (total === 0) {
      return (
        <section className="card card-elevated p-6 sm:p-8">
          <h2 className="mb-4 m-0 shrink-0 text-[13px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Roster Mix</h2>
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface-2)]">
              <Users className="h-7 w-7 text-[var(--text-muted)]" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">No slots scheduled yet</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Add volunteers to the next service plan to see the roster breakdown here.
              </p>
            </div>
            <Link
              href="/admin/service-plans"
              className="mt-1 inline-flex items-center justify-center rounded-full bg-amber-500 px-5 py-2 text-sm font-bold text-white no-underline transition-colors hover:bg-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              Generate schedule
            </Link>
          </div>
        </section>
      );
    }

    return (
      <section className="card card-elevated p-6 sm:p-8">
        <h2 className="mb-4 m-0 shrink-0 text-[13px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Roster Mix</h2>
        <div className="relative mb-8 flex justify-center">
          <svg className="h-48 w-48 -rotate-90" viewBox="0 0 192 192" role="img" aria-label={`Roster filled ${filledPct} percent`}>
            <circle cx="96" cy="96" r={STITCH_R} fill="transparent" stroke="var(--outline-variant)" strokeWidth="12" />
            <circle
              cx="96"
              cy="96"
              r={STITCH_R}
              fill="transparent"
              stroke="#f59e0b"
              strokeWidth="12"
              strokeDasharray={STITCH_C}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              className="transition-[stroke-dashoffset] duration-500 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-[var(--text-primary)]">{filledPct}%</span>
            <span className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Filled</span>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#f59e0b]" />
              <span className="text-sm font-medium text-[var(--text-secondary)]">Confirmed</span>
            </div>
            <span className="text-sm font-bold tabular-nums text-[var(--text-primary)]">{mix.confirmed}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#f59e0b]/60" />
              <span className="text-sm font-medium text-[var(--text-secondary)]">Awaiting reply</span>
            </div>
            <span className="text-sm font-bold tabular-nums text-[var(--text-primary)]">{mix.assigned}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[var(--surface-2)]" />
              <span className="text-sm font-medium text-[var(--text-secondary)]">Open slots</span>
            </div>
            <span className="text-sm font-bold tabular-nums text-[var(--text-primary)]">{mix.open}</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="card card-elevated p-6">
      <h2 className="card-title mb-1">Next service roster</h2>
      <p className="text-xs mb-5" style={{ color: "var(--text-muted)" }}>
        Assignment mix for the upcoming service
      </p>

      <div className="flex flex-col items-center gap-6">
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label={total === 0 ? "Roster: no assignments" : `Roster: ${total} roles`}
        >
          {/* Track */}
          <circle
            cx={CX}
            cy={CY}
            r={mid}
            fill="none"
            stroke="var(--divider, #f1f5f9)"
            strokeWidth={R_OUTER - R_INNER}
          />

          {slices.map((s) => (
            <path key={s.key} d={s.d} fill={s.fill} className="transition-[opacity,filter] duration-200 hover:brightness-95" />
          ))}

          {/* Centre disc */}
          <circle cx={CX} cy={CY} r={R_INNER - 4} fill="var(--btn-secondary-bg, #fff)" stroke="var(--border, #e5e7eb)" strokeWidth={1.5} />

          <text
            x={CX}
            y={CY - 6}
            textAnchor="middle"
            fontSize="30"
            fontWeight="600"
            fill="var(--text-primary)"
            style={{ fontFamily: "inherit" }}
          >
            {total}
          </text>
          <text
            x={CX}
            y={CY + 16}
            textAnchor="middle"
            fontSize="11"
            fill="var(--text-muted)"
            style={{ fontFamily: "inherit" }}
          >
            {total === 1 ? "role" : "roles"}
          </text>
        </svg>

        <ul className="w-full space-y-3 text-sm">
          {SEGMENTS.map(({ key, label, fill }) => (
            <li key={key} className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: fill }} aria-hidden />
              <span style={{ color: "var(--text-secondary)" }}>{label}</span>
              <span
                className="min-w-[1.75rem] text-right font-semibold tabular-nums"
                style={{ color: "var(--text-primary)" }}
              >
                {mix[key]}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
