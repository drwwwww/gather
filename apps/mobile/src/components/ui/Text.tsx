import React from "react";
import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from "react-native";
import { theme } from "../../theme/theme";

export type TextVariant = "title" | "subtitle" | "body" | "muted" | "label";

const variantStyle: Record<TextVariant, TextStyle> = {
  title: {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSize.title,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary
  },
  body: {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.regular,
    color: theme.colors.textPrimary
  },
  muted: {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.regular,
    color: theme.colors.textMuted
  },
  label: {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1
  }
};

export function Text({
  variant = "body",
  style,
  ...props
}: RNTextProps & { variant?: TextVariant }) {
  return <RNText {...props} style={[variantStyle[variant], style]} />;
}

