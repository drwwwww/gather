import React from "react";
import { View, Text as RNText, StyleSheet } from "react-native";
import { theme } from "../../theme/theme";

export type BadgeTone = "neutral" | "primary" | "success" | "warning" | "danger";

const toneStyle: Record<BadgeTone, { bg: string; text: string }> = {
  neutral: { bg: theme.colors.surface2, text: theme.colors.textSecondary },
  primary: { bg: theme.colors.primarySoft, text: theme.colors.primaryHover },
  success: { bg: theme.colors.successSoft, text: theme.colors.successOnSoft },
  warning: { bg: theme.colors.warningSoft, text: theme.colors.warningOnSoft },
  danger: { bg: theme.colors.dangerSoft, text: theme.colors.dangerOnSoft }
};

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: BadgeTone }) {
  const toneCfg = toneStyle[tone];
  return (
    <View style={[styles.base, { backgroundColor: toneCfg.bg }]}>
      <RNText style={[styles.text, { color: toneCfg.text }]}>{children}</RNText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: "flex-start"
  },
  text: {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold
  }
});

