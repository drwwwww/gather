"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Slow-drifting glyphs behind the hero. Deliberately sparse and low-contrast —
 * they should register as atmosphere, not decoration you actively notice.
 */

const CROSS = "M12 3v18M6.5 8.5h11";
const NOTE = "M9 18V5l10-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm10-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z";
const HEART = "M12 20s-7-4.6-7-9.2A4 4 0 0 1 12 8a4 4 0 0 1 7 2.8C19 15.4 12 20 12 20Z";
const SUN = "M12 4v2m0 12v2m8-8h-2M6 12H4m13.7-5.7-1.4 1.4M7.7 16.3l-1.4 1.4m11.4 0-1.4-1.4M7.7 7.7 6.3 6.3M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z";
const HANDS = "M7 11V6a1.5 1.5 0 0 1 3 0v5m0 0V4.5a1.5 1.5 0 0 1 3 0V11m0 0V6a1.5 1.5 0 0 1 3 0v7a7 7 0 0 1-7 7h-1a6 6 0 0 1-6-6v-3a1.5 1.5 0 0 1 3 0v2";

type Motif = {
  d: string;
  /** viewport percentages */
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  rotate: number;
  opacity: number;
};

const MOTIFS: Motif[] = [
  { d: CROSS, x: 8, y: 24, size: 30, duration: 17, delay: 0, rotate: -8, opacity: 0.16 },
  { d: NOTE, x: 84, y: 18, size: 26, duration: 21, delay: 1.4, rotate: 10, opacity: 0.13 },
  { d: SUN, x: 72, y: 62, size: 34, duration: 24, delay: 0.7, rotate: 0, opacity: 0.11 },
  { d: HEART, x: 18, y: 68, size: 24, duration: 19, delay: 2.1, rotate: 6, opacity: 0.12 },
  { d: HANDS, x: 92, y: 44, size: 28, duration: 23, delay: 1.1, rotate: -6, opacity: 0.1 },
  { d: CROSS, x: 34, y: 12, size: 18, duration: 26, delay: 2.6, rotate: 14, opacity: 0.1 },
  { d: NOTE, x: 58, y: 80, size: 20, duration: 20, delay: 0.4, rotate: -12, opacity: 0.1 },
];

export default function FloatingMotifs({
  tone = "dark",
}: {
  /** `dark` draws espresso glyphs for light backgrounds, `light` draws white. */
  tone?: "dark" | "light";
}) {
  const reduced = useReducedMotion();
  const stroke = tone === "light" ? "#ffffff" : "#7c2d08";

  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden>
      {MOTIFS.map((m, i) => (
        <motion.svg
          key={i}
          viewBox="0 0 24 24"
          width={m.size}
          height={m.size}
          fill="none"
          stroke={stroke}
          strokeWidth={1.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            position: "absolute",
            left: `${m.x}%`,
            top: `${m.y}%`,
            opacity: m.opacity,
          }}
          initial={reduced ? false : { y: 0, rotate: m.rotate }}
          animate={
            reduced
              ? undefined
              : {
                  y: [0, -22, 0],
                  rotate: [m.rotate, m.rotate + 5, m.rotate],
                }
          }
          transition={{
            duration: m.duration,
            delay: m.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <path d={m.d} />
        </motion.svg>
      ))}
    </div>
  );
}
