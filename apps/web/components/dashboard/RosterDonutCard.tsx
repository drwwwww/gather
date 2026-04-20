"use client";

export type RosterMix = {
  open: number;
  assigned: number;
  confirmed: number;
  declined: number;
};

// Chart 1 colour palette — mapped to our semantics
const SEGMENTS = [
  { key: "confirmed" as keyof RosterMix, label: "Confirmed",      light: "#bbf7d0", mid: "#4ade80", dark: "#22c55e" },
  { key: "assigned"  as keyof RosterMix, label: "Awaiting reply",  light: "#bae6fd", mid: "#38bdf8", dark: "#0ea5e9" },
  { key: "open"      as keyof RosterMix, label: "Open slots",      light: "#fef3c7", mid: "#fbbf24", dark: "#f59e0b" },
  { key: "declined"  as keyof RosterMix, label: "Declined",        light: "#fecaca", mid: "#f87171", dark: "#ef4444" },
] as const;

// ── Geometry — matches Chart 1's ~46 % ring-width / outer-radius ratio ─────
const SIZE    = 240;
const CX      = 120;
const CY      = 120;
const OUTER_R = 106;
const INNER_R = 58;
const RING_W  = OUTER_R - INNER_R;   // 48
const CAP_R   = RING_W / 2;          // 24
const MID_R   = (OUTER_R + INNER_R) / 2;  // 82
const GAP_DEG = 10;                   // angular gap that creates Chart 1's white sliver

function rad(deg: number) { return (deg - 90) * (Math.PI / 180); }
function fx(n: number)    { return n.toFixed(3); }

/**
 * Annular sector with semicircular rounded caps.
 * start/end caps use opposite sweep directions so each cap "rounds" its end:
 *   • start cap → sweep=0 (CCW, bulges before segment start)
 *   • end cap   → sweep=1 (CW,  bulges after  segment end)
 */
function sectorPath(startDeg: number, endDeg: number): string {
  const half = GAP_DEG / 2;
  const s    = rad(startDeg + half);
  const e    = rad(endDeg   - half);
  const span = endDeg - startDeg - GAP_DEG;
  if (span <= 0) return "";
  const la   = span > 180 ? 1 : 0;

  const cs = Math.cos(s), ss = Math.sin(s);
  const ce = Math.cos(e), se = Math.sin(e);

  const ox1 = CX + OUTER_R * cs,  oy1 = CY + OUTER_R * ss;
  const ox2 = CX + OUTER_R * ce,  oy2 = CY + OUTER_R * se;
  const ix1 = CX + INNER_R * cs,  iy1 = CY + INNER_R * ss;
  const ix2 = CX + INNER_R * ce,  iy2 = CY + INNER_R * se;

  return [
    `M ${fx(ix1)} ${fx(iy1)}`,
    `A ${fx(CAP_R)} ${fx(CAP_R)} 0 0 0 ${fx(ox1)} ${fx(oy1)}`,   // start cap CCW
    `A ${OUTER_R} ${OUTER_R} 0 ${la} 1 ${fx(ox2)} ${fx(oy2)}`,   // outer arc CW
    `A ${fx(CAP_R)} ${fx(CAP_R)} 0 0 1 ${fx(ix2)} ${fx(iy2)}`,   // end cap CW
    `A ${INNER_R} ${INNER_R} 0 ${la} 0 ${fx(ix1)} ${fx(iy1)}`,   // inner arc CCW
    "Z",
  ].join(" ");
}

function buildArcs(mix: RosterMix) {
  const total = SEGMENTS.reduce((a, s) => a + mix[s.key], 0);
  if (total === 0) return [];
  let cursor = 0;
  return SEGMENTS
    .filter((s) => mix[s.key] > 0)
    .map((s) => {
      const span = (mix[s.key] / total) * 360;
      const path = sectorPath(cursor, cursor + span);
      cursor += span;
      return { key: s.key, path, gradId: `rg-${s.key}`, light: s.light, dark: s.dark };
    });
}

export default function RosterDonutCard({ mix }: { mix: RosterMix }) {
  const total = SEGMENTS.reduce((a, s) => a + mix[s.key], 0);
  const arcs  = buildArcs(mix);

  return (
    <div className="card shadow-sm p-6">
      <h2 className="card-title mb-1">Next service roster</h2>
      <p className="text-xs mb-5" style={{ color: "var(--text-muted)" }}>
        Assignment mix for the upcoming service
      </p>

      <div className="flex flex-col items-center gap-6">
        <svg
          width={SIZE} height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label={`Roster: ${total} assignments`}
        >
          <defs>
            {/*
              Radial gradients in user-space — gradient origin fixed at
              upper-left so all segments share one cohesive light source,
              matching Chart 1's painted look.
            */}
            {SEGMENTS.map((s) => (
              <radialGradient
                key={s.key}
                id={`rg-${s.key}`}
                gradientUnits="userSpaceOnUse"
                cx={CX * 0.45} cy={CY * 0.45}
                r={OUTER_R * 1.4}
              >
                <stop offset="0%"   stopColor={s.light} />
                <stop offset="65%"  stopColor={s.mid}   />
                <stop offset="100%" stopColor={s.dark}  />
              </radialGradient>
            ))}
          </defs>

          {/* Light-grey full ring track */}
          <circle
            cx={CX} cy={CY} r={MID_R}
            fill="none"
            stroke="#f0f0f0"
            strokeWidth={RING_W}
          />

          {/* Data segments */}
          {arcs.map((arc) => arc.path && (
            <path key={arc.key} d={arc.path} fill={`url(#${arc.gradId})`} />
          ))}

          {/* White centre disc — Chart 1's hollow centre */}
          <circle cx={CX} cy={CY} r={INNER_R - 6} fill="white" />
          <circle cx={CX} cy={CY} r={INNER_R - 5} fill="none" stroke="#e8e8e8" strokeWidth="1.5" />

          {/* Centre: total */}
          <text x={CX} y={CY - 7} textAnchor="middle"
            fontSize="32" fontWeight="600" fill="#454459"
            style={{ fontFamily: "inherit" }}>
            {total}
          </text>
          {/* Centre: label */}
          <text x={CX} y={CY + 14} textAnchor="middle"
            fontSize="11" fill="#9ca3af"
            style={{ fontFamily: "inherit" }}>
            {total === 1 ? "role" : "roles"}
          </text>
        </svg>

        {/* Legend */}
        <ul className="w-full space-y-3 text-sm">
          {SEGMENTS.map(({ key, label, mid }) => (
            <li key={key} className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: mid }} aria-hidden />
              <span style={{ color: "var(--text-secondary)" }}>{label}</span>
              <span className="font-semibold tabular-nums text-right min-w-[1.75rem]"
                style={{ color: "var(--text-primary)" }}>
                {mix[key]}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
