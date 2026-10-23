/**
 * Gather's colour system: amber is the brand, five AREA colours say where you
 * are, and status colours (green / amber-orange / red) only ever mean an
 * answer. Each area has a strong `mark` (icons, dots, chart marks), a soft
 * `tint` (backgrounds) and a dark `ink` (text on the tint, ≥4.5:1).
 * Order and values were validated for colour-blind separation and contrast
 * on the paper background (dataviz validate_palette.js) — keep the order.
 * Tokens live in globals.css as --area-<hue>-{mark,tint,ink}.
 */

export type Hue = "teal" | "clay" | "blue" | "olive" | "plum";

export type AreaColors = { mark: string; tint: string; ink: string };

const hue = (h: Hue): AreaColors => ({
  mark: `var(--area-${h}-mark)`,
  tint: `var(--area-${h}-tint)`,
  ink: `var(--area-${h}-ink)`,
});

/** What each area of the church is coloured. */
export const AREA = {
  services: hue("teal"),
  news: hue("clay"),
  people: hue("blue"),
  ministries: hue("olive"),
  events: hue("plum"),
} as const;

export type Area = keyof typeof AREA;

/** Fixed order for things that need several colours (ministries, chart series). Never cycled past 5. */
export const HUE_ORDER: Hue[] = ["olive", "blue", "plum", "teal", "clay"];

/** The nth colour in the fixed order; past the fifth, everything shares a neutral. */
export function hueAt(index: number): AreaColors | null {
  const h = HUE_ORDER[index];
  return h ? hue(h) : null;
}

/** Soft brand amber in the same mark/tint/ink shape, for places that mix it in with the area hues. */
export const AMBER_SOFT: AreaColors = { mark: "#F59E0B", tint: "#FDF0D5", ink: "#7A4508" };

/**
 * Event date tiles take colours by their position in a list — soft amber first, then the
 * area hues — so neighbours always differ and a list reads varied (Google Calendar /
 * Notion) instead of one colour. Lists are date-ordered, so the next event is always amber.
 */
const EVENT_SET: AreaColors[] = [AMBER_SOFT, hue("teal"), hue("clay"), hue("blue"), hue("olive"), hue("plum")];
export function eventHue(index: number): AreaColors {
  return EVENT_SET[((index % EVENT_SET.length) + EVENT_SET.length) % EVENT_SET.length];
}

/** A stable colour for a person (initials avatars), so the same person always looks the same. */
export function hueForSeed(seed: string): AreaColors {
  let n = 0;
  for (let i = 0; i < seed.length; i++) n = (n * 31 + seed.charCodeAt(i)) >>> 0;
  return hue(HUE_ORDER[n % HUE_ORDER.length]);
}
