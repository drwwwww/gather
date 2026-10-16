import React, { useCallback } from "react";
import { Platform } from "react-native";
import { useRoute } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../screens/HomeScreen";
import AnnouncementsScreen from "../screens/AnnouncementsScreen";
import EventsScreen from "../screens/EventsScreen";
import AssignmentsScreen from "../screens/AssignmentsScreen";
import ServicePlanScreen from "../screens/ServicePlanScreen";
import TabBar from "../components/app/TabBar";

import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

const Tab = createBottomTabNavigator();

// Native keeps inactive tabs attached (Fabric / SceneView-safe). On web nothing
// hides them in that mode, so every tab renders stacked down one long page —
// detach there so only the focused tab shows.
const DETACH_INACTIVE = Platform.OS === "web";

/** Separate navigators so route count always matches visible tabs (Fabric / SceneView-safe). */
export default function MainTabs() {
  const route = useRoute();
  const params = route.params as { showServe?: boolean } | undefined;
  const showServe = params?.showServe ?? false;

  const tabBar = useCallback(
    (props: BottomTabBarProps) => <TabBar {...props} showServe={showServe} />,
    [showServe]
  );

  const screenOptions = {
    headerShown: false,
    lazy: false,
    freezeOnBlur: false,
    tabBarStyle: {
      position: "absolute" as const,
      backgroundColor: "transparent",
      borderTopWidth: 0,
      elevation: 0,
    },
    sceneContainerStyle: { paddingBottom: 88 },
  } as const;

  if (showServe) {
    return (
      <Tab.Navigator
        tabBar={tabBar}
        screenOptions={screenOptions}
        detachInactiveScreens={DETACH_INACTIVE}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Announcements" component={AnnouncementsScreen} />
        <Tab.Screen name="Events" component={EventsScreen} />
        <Tab.Screen name="ServicePlan" component={ServicePlanScreen} />
        <Tab.Screen name="Serve" component={AssignmentsScreen} />
      </Tab.Navigator>
    );
  }

  return (
    <Tab.Navigator
      tabBar={tabBar}
      screenOptions={screenOptions}
      detachInactiveScreens={DETACH_INACTIVE}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Announcements" component={AnnouncementsScreen} />
      <Tab.Screen name="Events" component={EventsScreen} />
    </Tab.Navigator>
  );
}
