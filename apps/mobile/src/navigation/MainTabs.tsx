import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import AnnouncementsScreen from '../screens/AnnouncementsScreen';
import EventsScreen from '../screens/EventsScreen';
import ServeScreen from '../screens/ServeScreen';
import TabBar from '../components/app/TabBar';

import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();

// You may need to define showServe or receive it as a prop. For now, default to true.
const showServe = true;

export default function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props: BottomTabBarProps) => <TabBar {...props} showServe={showServe} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Announcements" component={AnnouncementsScreen} />
      <Tab.Screen name="Events" component={EventsScreen} />
      {showServe && <Tab.Screen name="Serve" component={ServeScreen} />}
    </Tab.Navigator>
  );
}
