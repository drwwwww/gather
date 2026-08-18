import type { ReactElement } from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Icon as TabIcon, AppIconName } from "../ui/Icon";
import { palette, gradient, radius, shadow } from "../../theme/ds";

type TabDef = { key: string; icon: AppIconName };

const MEMBER_TABS: TabDef[] = [
  { key: "Home", icon: "home" },
  { key: "Announcements", icon: "announcements" },
  { key: "Events", icon: "events" },
];

const SERVE_TABS: TabDef[] = [
  ...MEMBER_TABS,
  { key: "ServicePlan", icon: "servicePlan" },
  { key: "Serve", icon: "serve" },
];

export function TabBar({ state, navigation, showServe }: any) {
  const tabs = showServe ? SERVE_TABS : MEMBER_TABS;
  const focused = state.routes[state.index]?.name as string | undefined;
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 14);

  return (
    <View style={styles.outer} pointerEvents="box-none">
      <View style={[styles.bar, { marginBottom: bottomPad }]}>
        {tabs.map((tab) => {
          const isFocused = focused === tab.key;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={() => navigation.navigate(tab.key)}
              style={styles.touchable}
            >
              {isFocused ? (
                <LinearGradient
                  colors={gradient.amber}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.activePill}
                >
                  <TabIcon name={tab.icon} size={23} color={palette.onDark} />
                </LinearGradient>
              ) : (
                <TabIcon name={tab.icon} size={23} color={palette.inkMuted} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default TabBar;

const styles = StyleSheet.create({
  outer: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "transparent" },
  bar: {
    marginHorizontal: 20,
    borderRadius: radius.pill,
    backgroundColor: palette.glassStrong,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassBorder,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 12,
    paddingHorizontal: 10,
    ...shadow.lg,
  },
  touchable: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 48 },
  activePill: {
    width: 52,
    height: 44,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.amber,
  },
});
