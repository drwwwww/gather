
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import MainTabs from './MainTabs';
import AnnouncementsDetailScreen from '../screens/AnnouncementsDetailScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import ProfileMenuScreen from '../screens/ProfileMenuScreen';
import ChurchInfoScreen from '../screens/ChurchInfoScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  // TODO: Replace with real logic for service team
  const showServe = true;
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" children={() => <MainTabs showServe={showServe} />} />
        <Stack.Screen name="AnnouncementsDetail" component={AnnouncementsDetailScreen} />
        <Stack.Screen name="EventDetail" component={EventDetailScreen} />
        <Stack.Screen name="ProfileMenu" component={ProfileMenuScreen} />
        <Stack.Screen name="ChurchInfo" component={ChurchInfoScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
