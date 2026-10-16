import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabs from "./MainTabs";
import AnnouncementsDetailScreen from "../screens/AnnouncementsDetailScreen";
import EventDetailScreen from "../screens/EventDetailScreen";
import ProfileMenuScreen from "../screens/ProfileMenuScreen";
import ChurchInfoScreen from "../screens/ChurchInfoScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import MembersScreen from "../screens/MembersScreen";
import SearchScreen from "../screens/SearchScreen";
import FeaturePlaceholderScreen from "../screens/FeaturePlaceholderScreen";
import GuidedTourScreen from "../screens/GuidedTourScreen";
import RequestToServeScreen from "../screens/RequestToServeScreen";
import DeleteAccountScreen from "../screens/DeleteAccountScreen";
import AppOverlays from "../components/app/AppOverlays";
import OfflineBanner from "../components/app/OfflineBanner";
import { ToastProvider } from "../components/ds";
import { navigationRef } from "./navigationRef";
import type { AppStackParamList } from "./paramLists";

export type { AppStackParamList };

const Stack = createNativeStackNavigator<AppStackParamList>();

type AppNavigatorProps = {
  showServe?: boolean;
};

export default function AppNavigator({ showServe = false }: AppNavigatorProps) {
  return (
    <NavigationContainer ref={navigationRef}>
      <ToastProvider>
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
          <Stack.Screen name="Search" component={SearchScreen} />
          <Stack.Screen name="FeaturePlaceholder" component={FeaturePlaceholderScreen} />
          <Stack.Screen name="GuidedTour" component={GuidedTourScreen} presentation="modal" />
          <Stack.Screen name="RequestToServe" component={RequestToServeScreen} />
          <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
        </Stack.Navigator>
        <AppOverlays />
        <OfflineBanner />
      </ToastProvider>
    </NavigationContainer>
  );
}
