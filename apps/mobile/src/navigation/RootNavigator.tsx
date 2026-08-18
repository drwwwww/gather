import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import SignInScreen from "../screens/SignInScreen";
import SignUpScreen from "../screens/SignUpScreen";
import ChurchSelectScreen from "../screens/ChurchSelectScreen";
import AccountDisabledScreen from "../screens/AccountDisabledScreen";
import ProfilePhotoScreen from "../screens/ProfilePhotoScreen";
import ProfileVerseScreen from "../screens/ProfileVerseScreen";
import AppNavigator from "./AppNavigator";
import { palette, font } from "../theme/ds";
import type { AuthStackParamList } from "./paramLists";

export type { AuthStackParamList };

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function RootNavigator() {
  const { loading, user, profile } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: palette.bg }}>
        <ActivityIndicator size="large" color={palette.amber} />
        <Text style={{ marginTop: 16, color: palette.inkMuted, fontFamily: font.regular }}>Loading…</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="SignIn">
          <Stack.Screen name="SignIn" component={SignInScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  if (profile?.disabled) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="AccountDisabled" component={AccountDisabledScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // Brand new user (no church, never been through the profile-builder) — build
  // their profile before they ever see church selection. Existing users who
  // later lose their church (profile_completed_at already set, backfilled for
  // every pre-existing row) skip straight to ChurchSelect/rejoin as before.
  if (profile && !profile.church_id && !profile.profile_completed_at) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="ProfilePhoto">
          <Stack.Screen name="ProfilePhoto" component={ProfilePhotoScreen} />
          <Stack.Screen name="ProfileVerse" component={ProfileVerseScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  if (!profile?.church_id) {
    // Only frame this as "step 4 of 4" for someone who just finished the
    // builder — not for an existing member re-picking a church after being
    // removed from one. There's no separate profile_completed_at "just now"
    // flag, so a short recency window is the simplest honest signal.
    const justFinishedBuilder =
      !!profile?.profile_completed_at &&
      Date.now() - new Date(profile.profile_completed_at).getTime() < 10 * 60 * 1000;
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen
            name="ChurchSelect"
            component={ChurchSelectScreen}
            initialParams={{ userId: user.id, showOnboardingProgress: justFinishedBuilder }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return <AppNavigator showServe={profile?.role === "SERVICE" || profile?.role === "ADMIN"} />;
}
