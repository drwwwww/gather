import { useEffect, useRef } from "react";
import { Animated, Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Icon as TabIcon, AppIconName } from "../ui/Icon";
import { usePressScale } from "../ds/motion";
import { useReduceMotion } from "../../hooks/useReduceMotion";
import { palette, font, space } from "../../theme/ds";

type TabDef = {
  key: string;
  /** Spoken label for screen readers. */
  label: string;
  /** Short visible label — five tabs leave ~70pt each, too tight for "Announcements". */
  shortLabel: string;
  icon: AppIconName;
};

const MEMBER_TABS: TabDef[] = [
  { key: "Home", label: "Home", shortLabel: "Home", icon: "home" },
  { key: "Announcements", label: "Announcements", shortLabel: "News", icon: "announcements" },
  { key: "Events", label: "Events", shortLabel: "Events", icon: "events" },
];

const SERVE_TABS: TabDef[] = [
  ...MEMBER_TABS,
  { key: "ServicePlan", label: "Service plan", shortLabel: "Plan", icon: "servicePlan" },
  { key: "Serve", label: "Serve", shortLabel: "Serve", icon: "serve" },
];

const ICON_SIZE = 24;
const ICON_BOX = 28;
const LABEL_HEIGHT = 14;

const isAndroid = Platform.OS === "android";

const TabItem = ({
  tab,
  isFocused,
  onPress,
}: {
  tab: TabDef;
  isFocused: boolean;
  onPress: () => void;
}) => {
  const reduceMotion = useReduceMotion();
  const press = usePressScale(0.94);
  // Mounts already settled, so nothing animates on first render.
  const progress = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(isFocused ? 1 : 0);
      return;
    }
    // A spring retargets from wherever it currently is, so a fast second tap
    // interrupts cleanly instead of queueing.
    Animated.spring(progress, {
      toValue: isFocused ? 1 : 0,
      bounciness: 0,
      speed: 24,
      useNativeDriver: true,
    }).start();
  }, [isFocused, reduceMotion, progress]);

  const iconScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
    extrapolate: "clamp",
  });
  const idleOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <Animated.View style={[styles.item, !isAndroid && press.style]}>
      <Pressable
        accessibilityRole="tab"
        accessibilityLabel={tab.label}
        aria-selected={isFocused}
        onPress={onPress}
        onPressIn={isAndroid ? undefined : press.onPressIn}
        onPressOut={isAndroid ? undefined : press.onPressOut}
        android_ripple={{ color: "rgba(30,26,38,0.08)", borderless: true, radius: 34 }}
        style={styles.touchable}
      >
        {/* Idle and active layers cross-fade; the colors differ so one can't just be tinted. */}
        <Animated.View style={[styles.iconBox, { transform: [{ scale: iconScale }] }]}>
          <Animated.View style={[styles.layer, { opacity: idleOpacity }]}>
            <TabIcon name={tab.icon} size={ICON_SIZE} color={palette.inkSoft} />
          </Animated.View>
          <Animated.View style={[styles.layer, { opacity: progress }]}>
            <TabIcon name={tab.icon} size={ICON_SIZE} color={palette.amberInk} />
          </Animated.View>
        </Animated.View>

        <View style={styles.labelBox}>
          <Animated.Text
            numberOfLines={1}
            maxFontSizeMultiplier={1.2}
            style={[styles.label, styles.labelIdle, { opacity: idleOpacity }]}
          >
            {tab.shortLabel}
          </Animated.Text>
          <Animated.Text
            numberOfLines={1}
            maxFontSizeMultiplier={1.2}
            style={[styles.label, styles.labelActive, { opacity: progress }]}
          >
            {tab.shortLabel}
          </Animated.Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

/** Classic bottom tab bar: full width, solid surface flush with the screen
    bottom, hairline on top, icon over label, brand color on the active tab.
    The surface extends under the home indicator / gesture bar, so its bottom
    padding is the live safe-area inset (Android 15 / SDK 57 are edge-to-edge,
    so content draws under system bars unless inset). */
export function TabBar({ state, navigation, showServe }: any) {
  const tabs = showServe ? SERVE_TABS : MEMBER_TABS;
  const focused = state.routes[state.index]?.name as string | undefined;
  const insets = useSafeAreaInsets();

  return (
    <View
      accessibilityRole="tablist"
      style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space.sm) }]}
    >
      {tabs.map((tab) => {
        const isFocused = focused === tab.key;
        return (
          <TabItem
            key={tab.key}
            tab={tab}
            isFocused={isFocused}
            onPress={() => {
              if (!isFocused) Haptics.selectionAsync().catch(() => {});
              navigation.navigate(tab.key);
            }}
          />
        );
      })}
    </View>
  );
}

export default TabBar;

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    paddingTop: space.sm,
    backgroundColor: palette.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.line,
  },
  item: { flex: 1 },
  touchable: {
    width: "100%",
    minHeight: 44,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingBottom: space.xs,
  },
  iconBox: {
    width: ICON_BOX,
    height: ICON_BOX,
    alignItems: "center",
    justifyContent: "center",
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  labelBox: {
    alignSelf: "stretch",
    height: LABEL_HEIGHT,
    marginTop: 2,
  },
  label: {
    ...StyleSheet.absoluteFillObject,
    textAlign: "center",
    fontSize: 11,
    lineHeight: LABEL_HEIGHT,
  },
  labelIdle: { fontFamily: font.medium, color: palette.inkSoft },
  labelActive: { fontFamily: font.semibold, color: palette.amberInk },
});
