import type { ReactElement } from "react";
import { StyleSheet, View, Pressable, Text, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon as TabIcon } from "../ui/Icon";
import { theme } from "../../theme/theme";

type TabDef = { key: string; label: string; icon: (props: { color: string; size: number }) => ReactElement };

const MEMBER_TAB_DEFS: TabDef[] = [
  { key: "Home", label: "Home", icon: (p) => <TabIcon name="home" size={p.size} color={p.color} /> },
  { key: "Announcements", label: "News", icon: (p) => <TabIcon name="announcements" size={p.size} color={p.color} /> },
  { key: "Events", label: "Events", icon: (p) => <TabIcon name="events" size={p.size} color={p.color} /> },
];

const SERVE_TAB_DEFS: TabDef[] = [
  ...MEMBER_TAB_DEFS,
  { key: "ServicePlan", label: "Bulletin", icon: (p) => <TabIcon name="servicePlan" size={p.size} color={p.color} /> },
  { key: "Serve", label: "Serve", icon: (p) => <TabIcon name="serve" size={p.size} color={p.color} /> },
];

export function TabBar({ state, navigation, showServe }: any) {
  const tabs = showServe ? SERVE_TAB_DEFS : MEMBER_TAB_DEFS;
  const focusedName = state.routes[state.index]?.name as string | undefined;
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);

  /** Stitch `screen-10-serve.html` nav: `bg-white/85 backdrop-blur-xl` — RN uses opaque frosted white (avoids Expo Blur view-manager warnings). */
  const glassNav = (
    <View style={[styles.blurWrap, styles.glassNav, { marginBottom: bottomPad }]}>
      <View style={styles.row}>
        {tabs.map((tab) => {
          const isFocused = focusedName === tab.key;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={() => navigation.navigate(tab.key)}
              style={styles.tabTouchable}
            >
              <View style={[styles.tabPill, isFocused && styles.tabPillActive]}>
                {tab.icon({
                  color: isFocused ? theme.colors.primary : theme.colors.textMuted,
                  size: 22,
                })}
                <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>{tab.label}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={styles.outer} pointerEvents="box-none">
      {glassNav}
    </View>
  );
}

export default TabBar;

const styles = StyleSheet.create({
  outer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "stretch",
    backgroundColor: "transparent",
  },
  blurWrap: {
    marginHorizontal: 16,
    borderRadius: 999,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#F59E0B",
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.08,
        shadowRadius: 32,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  glassNav: {
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(229, 231, 235, 0.9)",
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  tabTouchable: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  tabPill: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  tabPillActive: {
    backgroundColor: theme.colors.primarySoft,
  },
  tabLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 4,
    fontFamily: theme.typography.fontFamily,
    textAlign: "center",
    letterSpacing: 1,
    textTransform: "uppercase",
    fontWeight: theme.typography.fontWeight.semibold as any,
  },
  tabLabelActive: {
    color: theme.colors.primary,
  },
});
