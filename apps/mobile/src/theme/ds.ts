/**
 * Gather Design System — "Aurora"
 * Airy soft-gradient ambience, glassmorphic controls, floating cards, amber accent.
 *
 * Rubik loads in App.tsx as weight-specific families (Rubik_400Regular …); the plain
 * "Rubik" name is not registered, so we reference the real family names here.
 */

export const font = {
  light: "Rubik_300Light",
  regular: "Rubik_400Regular",
  medium: "Rubik_500Medium",
  semibold: "Rubik_600SemiBold",
  bold: "Rubik_700Bold",
} as const;

export const palette = {
  // Ambient base + surfaces
  bg: "#FAF8FE",
  surface: "#FFFFFF",
  glass: "rgba(255,255,255,0.62)",
  glassStrong: "rgba(255,255,255,0.85)",
  glassBorder: "rgba(255,255,255,0.75)",
  sunken: "#F1EEF8",
  overlay: "rgba(30,26,38,0.42)",

  // Ink (cool near-black, tuned to sit on the warm-lilac wash)
  ink: "#1E1A26",
  inkSoft: "#6A6478",
  inkMuted: "#A7A1B4",
  onDark: "#FFFFFF",
  onDarkSoft: "rgba(255,255,255,0.72)",
  onDarkFaint: "rgba(255,255,255,0.42)",

  // Hairlines
  line: "#EAE5F1",
  lineSoft: "#F3EFF8",

  // Brand amber (sacred — accent / active / CTA only)
  amber: "#F59E0B",
  amberDeep: "#E07E00",
  amberBright: "#FDB84D",
  amberSoft: "#FDECCE",
  amberSofter: "#FFF6E7",

  // Status
  success: "#12B76A",
  successSoft: "#E6F8F0",
  successInk: "#07653B",
  danger: "#F04438",
  dangerSoft: "#FEECEA",
  dangerInk: "#912018",
  info: "#5B8DEF",
} as const;

export const gradient = {
  /** Full-screen ambient wash — warm peach → soft mauve → near-white. */
  ambient: ["#FDEEDF", "#F6EEF7", "#FBF9FE"] as const,
  /** Primary CTA / accent tiles */
  amber: ["#FDBE5A", "#F3920A"] as const,
  /** Warmer, punchier amber for key CTAs */
  sunset: ["#FFB86B", "#F5820B"] as const,
  /** Soft amber tint card */
  amberWash: ["#FFF3DE", "#FFE7C2"] as const,
} as const;

export const radius = {
  chip: 12,
  sm: 14,
  md: 18,
  lg: 22,
  xl: 28,
  xxl: 34,
  pill: 999,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  gutter: 20,
} as const;

/** Soft, cool-tinted elevation — the airy floating look. */
export const shadow = {
  sm: {
    shadowColor: "#8A7CB0",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 2,
  },
  md: {
    shadowColor: "#8477AC",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.13,
    shadowRadius: 24,
    elevation: 5,
  },
  lg: {
    shadowColor: "#77699F",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.17,
    shadowRadius: 40,
    elevation: 11,
  },
  amber: {
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.34,
    shadowRadius: 20,
    elevation: 7,
  },
} as const;

export const type = {
  greeting: { fontFamily: font.bold, fontSize: 30, lineHeight: 36, letterSpacing: -0.6 },
  display: { fontFamily: font.bold, fontSize: 34, lineHeight: 40, letterSpacing: -0.7 },
  h1: { fontFamily: font.bold, fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
  h2: { fontFamily: font.bold, fontSize: 22, lineHeight: 28, letterSpacing: -0.3 },
  h3: { fontFamily: font.semibold, fontSize: 17, lineHeight: 22, letterSpacing: -0.2 },
  bodyLg: { fontFamily: font.regular, fontSize: 16, lineHeight: 24 },
  body: { fontFamily: font.regular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: font.semibold, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: font.semibold, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: font.regular, fontSize: 12, lineHeight: 16 },
  eyebrow: {
    fontFamily: font.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.4,
    textTransform: "uppercase" as const,
  },
} as const;

export type FontWeightKey = keyof typeof font;
