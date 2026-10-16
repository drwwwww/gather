import { useEffect, useRef } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";
import type { AppIconName } from "../ui/Icon";
import { useReduceMotion } from "../../hooks/useReduceMotion";
import { palette, font } from "../../theme/ds";

type Glyph = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

export type TabDef = {
  key: string;
  /** Spoken label for screen readers. */
  label: string;
  /** Short visible label — five tabs leave ~75pt each, too tight for "Announcements". */
  shortLabel: string;
  /** App icon name, used where a tab is referenced outside the bar (e.g. the tour). */
  icon: AppIconName;
  /** Outline glyph when idle, filled glyph when selected (iOS + Material convention). */
  glyph: Glyph;
  glyphActive: Glyph;
};

export const MEMBER_TABS: TabDef[] = [
  { key: "Home", label: "Home", shortLabel: "Home", icon: "home", glyph: "home-variant-outline", glyphActive: "home-variant" },
  { key: "Announcements", label: "Announcements", shortLabel: "News", icon: "announcements", glyph: "bullhorn-outline", glyphActive: "bullhorn" },
  { key: "Events", label: "Events", shortLabel: "Events", icon: "events", glyph: "calendar-blank-outline", glyphActive: "calendar-blank" },
];

export const SERVE_TABS: TabDef[] = [
  ...MEMBER_TABS,
  { key: "ServicePlan", label: "Service plan", shortLabel: "Plan", icon: "servicePlan", glyph: "clipboard-text-outline", glyphActive: "clipboard-text" },
  { key: "Serve", label: "Serve", shortLabel: "Serve", icon: "serve", glyph: "hand-heart-outline", glyphActive: "hand-heart" },
];

const isAndroid = Platform.OS === "android";

/**
 * Platform metrics, straight from the platform specs rather than eyeballed:
 *  - iOS (HIG): 49pt bar above the home-indicator inset, ~25pt glyph,
 *    10pt label, no selection indicator — the filled glyph + tint is the cue.
 *  - Android (Material 3 navigation bar): 80dp bar, 24dp icon inside a
 *    64×32 active-indicator pill, 12sp label 4dp below, ripple on the pill.
 * The web preview uses the iOS metrics.
 */
const M = isAndroid
  ? { barHeight: 80, padTop: 12, icon: 24, pillW: 64, pillH: 32, gap: 4, label: 12, labelLine: 16 }
  : { barHeight: 49, padTop: 4, icon: 25, pillW: 0, pillH: 28, gap: 2, label: 10, labelLine: 12 }; // label ends 3pt above the bar's bottom, as on iOS

const ACTIVE = palette.amberInk; // ~5:1 on white — plain amber is too faint for 10–12pt text
const IDLE = palette.inkSoft;

const TabItem = ({ tab, isFocused, onPress }: { tab: TabDef; isFocused: boolean; onPress: () => void }) => {
  const reduceMotion = useReduceMotion();
  // Mounts settled, so nothing animates on first render.
  const progress = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(isFocused ? 1 : 0);
      return;
    }
    // Interruptible: a fast second tap retargets instead of queueing.
    Animated.spring(progress, { toValue: isFocused ? 1 : 0, bounciness: 0, speed: 22, useNativeDriver: true }).start();
  }, [isFocused, reduceMotion, progress]);

  // Material 3: the indicator pill grows out from the centre (scaleX) as the tab is selected.
  const pillScale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={tab.label}
      aria-selected={isFocused}
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [
        styles.item,
        // iOS tab bars dim on touch-down — no scaling, no movement.
        !isAndroid && pressed && styles.pressedIOS,
      ]}
    >
      <View style={styles.iconSlot}>
        {isAndroid ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.pill, { opacity: progress, transform: [{ scaleX: pillScale }] }]}
          />
        ) : null}
        {isAndroid ? (
          // Ripple bounded to the pill, as in Material 3, rather than the whole column.
          <Pressable
            onPress={onPress}
            android_ripple={{ color: "rgba(30,26,38,0.12)", borderless: false }}
            style={styles.rippleTarget}
            importantForAccessibility="no-hide-descendants"
          />
        ) : null}
        <MaterialCommunityIcons
          name={isFocused ? tab.glyphActive : tab.glyph}
          size={M.icon}
          color={isFocused ? ACTIVE : IDLE}
        />
      </View>
      <Text
        numberOfLines={1}
        maxFontSizeMultiplier={1.2}
        style={[styles.label, isFocused ? styles.labelActive : styles.labelIdle]}
      >
        {tab.shortLabel}
      </Text>
    </Pressable>
  );
};

/** Classic bottom tab bar, laid out in normal flow below the screens (not
    absolutely positioned), so every tab screen ends exactly at the bar's top
    edge on every device. The surface runs under the home indicator / gesture
    bar: its bottom padding is the live safe-area inset. */
export function TabBar({ state, navigation, showServe }: any) {
  const tabs = showServe ? SERVE_TABS : MEMBER_TABS;
  const focused = state.routes[state.index]?.name as string | undefined;
  const insets = useSafeAreaInsets();

  return (
    <View accessibilityRole="tablist" style={[styles.bar, { paddingBottom: insets.bottom }]}>
      <View style={styles.row}>
        {tabs.map((tab) => {
          const isFocused = focused === tab.key;
          return (
            <TabItem
              key={tab.key}
              tab={tab}
              isFocused={isFocused}
              onPress={() => {
                const event = navigation.emit({ type: "tabPress", target: state.routes.find((r: any) => r.name === tab.key)?.key, canPreventDefault: true });
                if (isFocused || event.defaultPrevented) return;
                if (Platform.OS === "ios") Haptics.selectionAsync().catch(() => {});
                navigation.navigate(tab.key);
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

export default TabBar;

const styles = StyleSheet.create({
  bar: {
    backgroundColor: palette.surface,
    // A divider, not depth — stays a hairline border (ui-surfaces rule).
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.line,
  },
  row: { flexDirection: "row", height: M.barHeight },
  // The whole column is the hit target: full bar height × ~75pt wide.
  item: { flex: 1, alignItems: "center", paddingTop: M.padTop },
  pressedIOS: { opacity: 0.5 },
  iconSlot: {
    width: isAndroid ? M.pillW : 44,
    height: M.pillH,
    alignItems: "center",
    justifyContent: "center",
  },
  pill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: M.pillH / 2,
    backgroundColor: palette.amberSoft,
  },
  rippleTarget: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: M.pillH / 2,
    overflow: "hidden",
  },
  label: {
    marginTop: M.gap,
    fontSize: M.label,
    lineHeight: M.labelLine,
    letterSpacing: isAndroid ? 0.5 : 0.1,
    textAlign: "center",
  },
  labelIdle: { fontFamily: font.medium, color: IDLE },
  labelActive: { fontFamily: font.semibold, color: ACTIVE },
});
