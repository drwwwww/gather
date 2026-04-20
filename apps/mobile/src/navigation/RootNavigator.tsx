import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import SignInScreen from "../screens/SignInScreen";
import SignUpScreen from "../screens/SignUpScreen";
import ChurchSelectScreen from "../screens/ChurchSelectScreen";
import AccountDisabledScreen from "../screens/AccountDisabledScreen";
import AppNavigator from "./AppNavigator";
import { theme } from "../theme/theme";
import type { AuthStackParamList } from "./paramLists";

export type { AuthStackParamList };

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function RootNavigator() {
  const { loading, user, profile } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16, color: theme.colors.muted }}>Loading...</Text>
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

  if (!profile?.church_id) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen
            name="ChurchSelect"
            component={ChurchSelectScreen}
            initialParams={{
              userId: user.id,
              fullName: user.user_metadata?.full_name ?? "",
              email: user.email ?? "",
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return <AppNavigator showServe={profile?.role === "SERVICE" || profile?.role === "ADMIN"} />;
}
