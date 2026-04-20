// Gather Mobile Design Tokens (aligned with apps/web/app/globals.css)
// Note: React Native does not support oklch() directly, so we use close hex/RGB approximations.
export const colors = {
  // Backgrounds / surfaces
  background: "#FDFCF8", // ~ --bg
  surface: "#F5F4F1", // ~ --surface
  surface2: "#EEEAE2", // ~ --surface-2
  card: "#FFFFFF",

  // Text
  textPrimary: "#111827", // --text-primary
  textSecondary: "#4B5563", // --text-secondary
  textMuted: "#9CA3AF", // --text-muted

  // Borders
  border: "#E5E7EB", // --border
  divider: "#F1F5F9", // --divider

  // Brand
  primary: "#F59E0B", // close to --primary (amber)
  primaryHover: "#D97706", // close to --primary-hover
  primarySoft: "#FFF7E6", // close to --primary-soft
  onPrimary: "#FFFFFF", // --btn-primary-text

  // Status
  success: "#22C55E",
  successSoft: "#DCFCE7",
  successOnSoft: "#166534",
  warning: "#F59E0B",
  warningSoft: "#FFEDD5",
  warningOnSoft: "#9A3412",
  danger: "#DC2626",
  dangerHover: "#B91C1C",
  dangerSoft: "#FEE2E2",
  dangerOnSoft: "#991B1B",
  info: "#3B82F6",

  /** iOS/Android shadow color (RN); not a Figma token. */
  shadow: "#000000",

  // Back-compat aliases (existing mobile screens/components)
  primaryText: "#111827",
  muted: "#9CA3AF",
  secondary: "#FFFFFF",
  error: "#DC2626",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radii = {
  // Web uses pill/box radii; these are the practical RN equivalents.
  sm: 12,
  md: 14,
  lg: 18,
  xl: 24,
};

export const typography = {
  fontFamily: "Rubik",
  fontSize: {
    xs: 12,
    sm: 13,
    md: 16,
    lg: 18,
    xl: 22,
    title: 28,
  },
  fontWeight: {
    light: "300",
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
};
