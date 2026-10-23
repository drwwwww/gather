/**
 * Gather's colour system, same as the web (apps/web/lib/areas.ts): amber is the
 * brand, five AREA colours say what something is about, and status colours only
 * ever mean an answer. Each area has a strong `mark` (icons, dots), a soft `tint`
 * (backgrounds) and a dark `ink` (text on the tint, ≥4.5:1). Values and order were
 * validated for colour-blind separation and contrast — keep them in step with the web.
 */

export type Hue = "teal" | "clay" | "blue" | "olive" | "plum";
export type AreaColors = { mark: string; tint: string; ink: string };

const HUES: Record<Hue, AreaColors> = {
  teal: { mark: "#009B90", tint: "#E0F2EF", ink: "#0B5E57" },
  clay: { mark: "#D46A2E", tint: "#FBE8DE", ink: "#8A3A12" },
  blue: { mark: "#3466B8", tint: "#E4ECF8", ink: "#1E447F" },
  olive: { mark: "#6E8F2E", tint: "#EBF0DD", ink: "#44591A" },
  plum: { mark: "#A0529F", tint: "#F4E6F3", ink: "#6B2F6A" },
};

/** What each area of the church is coloured. */
export const AREA = {
  services: HUES.teal,
  news: HUES.clay,
  people: HUES.blue,
  ministries: HUES.olive,
  events: HUES.plum,
} as const;

export type Area = keyof typeof AREA;

/** Fixed order for things that need several colours. Never cycled past 5. */
const HUE_ORDER: Hue[] = ["olive", "blue", "plum", "teal", "clay"];

/** The nth colour in the fixed order (ministries); past the fifth, null = neutral. */
export function hueAt(index: number): AreaColors | null {
  const h = HUE_ORDER[index];
  return h ? HUES[h] : null;
}

/** Soft brand amber in the same shape, for lists that mix it in with the area hues. */
export const AMBER_SOFT: AreaColors = { mark: "#F59E0B", tint: "#FDF0D5", ink: "#7A4508" };

/** Event date tiles by list position — soft amber first, then the area hues — so neighbours differ. */
const EVENT_SET: AreaColors[] = [AMBER_SOFT, HUES.teal, HUES.clay, HUES.blue, HUES.olive, HUES.plum];
export function eventHue(index: number): AreaColors {
  return EVENT_SET[((index % EVENT_SET.length) + EVENT_SET.length) % EVENT_SET.length];
}

/** A stable colour for a person (initials avatars) — same hash as the web, so people match across apps. */
export function hueForSeed(seed: string): AreaColors {
  let n = 0;
  for (let i = 0; i < seed.length; i++) n = (n * 31 + seed.charCodeAt(i)) >>> 0;
  return HUES[HUE_ORDER[n % HUE_ORDER.length]];
}
