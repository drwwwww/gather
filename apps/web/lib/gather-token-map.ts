/**
 * Figma / template handoff → Gather design system
 *
 * Source of truth for colors: apps/web/app/globals.css (:root) and
 * apps/mobile/src/theme/tokens.ts (hex approximations for React Native).
 *
 * When mapping exported code, replace template values with the CSS variable
 * (web) or token key (mobile) below — do not introduce one-off hex unless
 * you add a matching semantic token in both places.
 */

/** Web: use in style={{ color: "var(--text-primary)" }} or Tailwind that references these. */
export const webCssVariables = [
  "--bg",
  "--surface",
  "--surface-2",
  "--text-primary",
  "--text-secondary",
  "--text-muted",
  "--border",
  "--divider",
  "--primary",
  "--primary-hover",
  "--primary-soft",
  "--success",
  "--success-hover",
  "--warning",
  "--danger",
  "--danger-hover",
  "--info",
] as const;

/** Mobile: import { theme } from "@/theme/theme" (or ../theme/theme); use theme.colors.<key> */
export const mobileColorKeys = [
  "background",
  "surface",
  "surface2",
  "card",
  "textPrimary",
  "textSecondary",
  "textMuted",
  "border",
  "divider",
  "primary",
  "primaryHover",
  "primarySoft",
  "onPrimary",
  "success",
  "successSoft",
  "successOnSoft",
  "warning",
  "warningSoft",
  "warningOnSoft",
  "danger",
  "dangerHover",
  "dangerSoft",
  "dangerOnSoft",
  "info",
  "shadow",
] as const;

/**
 * Documented gaps (Figma often names differently; map to these instead of new hex):
 *
 * - OKLCH in Figma/CSS: web keeps OKLCH in globals.css; mobile uses hex in tokens.ts only.
 * - Drop-in exports: place raw plugin output under design-handoff/web or design-handoff/mobile,
 *   then refactor screens to use webCssVariables / theme.colors.
 */
