import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabs from "./MainTabs";
import AnnouncementsDetailScreen from "../screens/AnnouncementsDetailScreen";
import EventDetailScreen from "../screens/EventDetailScreen";
import ProfileMenuScreen from "../screens/ProfileMenuScreen";
import ChurchInfoScreen from "../screens/ChurchInfoScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import MembersScreen from "../screens/MembersScreen";
import FeaturePlaceholderScreen from "../screens/FeaturePlaceholderScreen";
import type { AppStackParamList } from "./paramLists";

export type { AppStackParamList };

const Stack = createNativeStackNavigator<AppStackParamList>();

type AppNavigatorProps = {
  showServe?: boolean;
};

export default function AppNavigator({ showServe = false }: AppNavigatorProps) {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          freezeOnBlur: false,
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} initialParams={{ showServe }} />
        <Stack.Screen name="AnnouncementsDetail" component={AnnouncementsDetailScreen} />
        <Stack.Screen name="EventDetail" component={EventDetailScreen} />
        <Stack.Screen name="ProfileMenu" component={ProfileMenuScreen} />
        <Stack.Screen name="ChurchInfo" component={ChurchInfoScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Members" component={MembersScreen} />
        <Stack.Screen name="FeaturePlaceholder" component={FeaturePlaceholderScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
