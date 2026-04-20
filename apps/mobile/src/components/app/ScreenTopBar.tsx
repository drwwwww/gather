import type { ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { theme } from "../../theme/theme";

export function ProfileMenuAvatar({ navigation }: { navigation: { navigate: (name: string) => void } }) {
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate("ProfileMenu")}
      accessibilityLabel="Open profile menu"
      style={{ marginTop: 2 }}
    >
      <Image
        source={require("../../../assets/logo.png")}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.surface,
        }}
      />
    </TouchableOpacity>
  );
}

type Nav = { goBack: () => void };

export type ScreenTopBarProps = {
  navigation: Nav;
  /** When true, shows ← Back on the left (stack / modal screens). */
  showBack?: boolean;
  title?: string;
  subtitle?: string;
  /** e.g. profile avatar button — aligned right */
  rightAccessory?: ReactNode;
};

export function ScreenTopBar({
  navigation,
  showBack = false,
  title,
  subtitle,
  rightAccessory,
}: ScreenTopBarProps) {
  return (
    <View style={styles.row}>
      <View style={[styles.leftSlot, !showBack && styles.leftSlotHidden]}>
        {showBack ? (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={{ top: 12, bottom: 12, left: 4, right: 12 }}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={styles.titleBlock}>
        {title ? (
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightAccessory ? <View style={styles.rightSlot}>{rightAccessory}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    minHeight: 44,
  },
  leftSlot: {
    width: 88,
    flexShrink: 0,
    paddingTop: 2,
  },
  leftSlotHidden: {
    width: 0,
    overflow: "hidden",
  },
  backText: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.bold,
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: theme.spacing.xs,
  },
  title: {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSize.title,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primaryText,
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.muted,
    marginTop: 2,
  },
  rightSlot: {
    flexShrink: 0,
    marginLeft: theme.spacing.sm,
    paddingTop: 2,
  },
});
