import type { ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ProfileMenuAvatar } from "./ScreenTopBar";
import { theme } from "../../theme/theme";
import { STITCH_PAD_H, stitchHeroSubtitle, stitchHeroTitle } from "../../theme/stitch";

type Nav = { goBack: () => void; navigate: (name: string, params?: object) => void };

type BackRowProps = {
  navigation: Nav;
  /** `undefined` = profile avatar; `null` = no right slot (e.g. sign up). */
  rightAccessory?: ReactNode | null;
};

/** Top row: ← Back (amber) + optional profile — matches stack screens in Stitch flow. */
export function StitchStackBackRow({ navigation, rightAccessory }: BackRowProps) {
  const right =
    rightAccessory === undefined ? <ProfileMenuAvatar navigation={navigation} /> : rightAccessory;
  return (
    <View style={styles.backPad}>
      <View style={styles.backRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={{ top: 12, bottom: 12, left: 4, right: 12 }}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        {right}
      </View>
    </View>
  );
}

type HeroProps = {
  title: string;
  subtitle?: string;
  /** Extra space below hero (default ~40px like HTML `mb-12` / section rhythm). */
  marginBottom?: number;
};

export function StitchHero({ title, subtitle, marginBottom = 40 }: HeroProps) {
  return (
    <View style={{ marginTop: 8, marginBottom }}>
      <Text style={[stitchHeroTitle, { marginBottom: subtitle ? 16 : 0 }]}>{title}</Text>
      {subtitle ? <Text style={stitchHeroSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  backPad: {
    paddingHorizontal: STITCH_PAD_H,
    paddingTop: 10,
    paddingBottom: 8,
  },
  backRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backText: {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.primary,
  },
});
