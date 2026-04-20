import type { TextStyle, ViewStyle } from "react-native";
import { theme } from "./theme";

/** Horizontal padding used across Stitch HTML (`px-6` = 24px). */
export const STITCH_PAD_H = 24;

/** Card shadow from `screen-10-serve.html` (`shadow-[0_32px_32px_-4px_rgba(245,158,11,0.04)]`). */
export const stitchCardShadow: ViewStyle = {
  shadowColor: "#F59E0B",
  shadowOffset: { width: 0, height: 32 },
  shadowOpacity: 0.04,
  shadowRadius: 32,
  elevation: 4,
};

/** Primary headline size (`text-[3.5rem]` = 56px). */
export const stitchHeroTitle: TextStyle = {
  fontFamily: theme.typography.fontFamily,
  fontSize: 56,
  lineHeight: 62,
  fontWeight: theme.typography.fontWeight.bold as any,
  color: theme.colors.primaryText,
  letterSpacing: -0.5,
};

export const stitchHeroSubtitle: TextStyle = {
  fontFamily: theme.typography.fontFamily,
  fontSize: theme.typography.fontSize.lg,
  lineHeight: 26,
  color: theme.colors.textSecondary,
};

/** Form inputs from `screen-01-design-system.html`. */
export const stitchTextField: ViewStyle = {
  width: "100%",
  paddingHorizontal: 24,
  paddingVertical: 16,
  backgroundColor: theme.colors.surface,
  borderWidth: 1,
  borderColor: theme.colors.border,
  borderRadius: theme.radii.lg,
  fontSize: theme.typography.fontSize.md,
  color: theme.colors.primaryText,
  fontFamily: theme.typography.fontFamily,
};

export function stitchFilledCard(): ViewStyle {
  return {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.lg,
    padding: 24,
    ...stitchCardShadow,
  };
}

/** `surface-container-low` from Stitch dossier — Message of the Day panel. */
export const stitchEditorialPanel: ViewStyle = {
  backgroundColor: "#F4F4F0",
  borderRadius: theme.radii.lg,
  padding: 40,
  overflow: "hidden",
};

/** Date badge on home event rows (`bg-primary-fixed` in dossier `home/code.html`). */
export const stitchPrimaryFixedBg = "#FFDBB8";

/** Organic amber shadow for list rows (`0_4px_20px_-4px_rgba(245,158,11,0.05)`). */
export const stitchRowShadowSoft: ViewStyle = {
  shadowColor: "#F59E0B",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 20,
  elevation: 2,
};
