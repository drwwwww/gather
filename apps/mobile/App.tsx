import React from "react";
import { View, ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts, Rubik_300Light, Rubik_400Regular, Rubik_500Medium, Rubik_600SemiBold, Rubik_700Bold } from "@expo-google-fonts/rubik";
import { AuthProvider } from "./src/context/AuthContext";
import RootNavigator from "./src/navigation/RootNavigator";
import { theme } from "./src/theme/theme";
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://cbd58ac7b8466096279b462ce2ac567f@o4511904277594113.ingest.us.sentry.io/4511905796849664',

  // Privacy: no IP addresses / cookies / user emails attached to events —
  // this is what the privacy policy and the App Store / Play data-safety
  // answers promise ("diagnostics, not linked to identity"). Change those
  // together if this ever changes.
  sendDefaultPii: false,

  enableLogs: true,
  tracesSampleRate: 0.2,

  // Replay only when an error happens, never a random sample of sessions.
  // The integration masks all text, images and inputs by default — keep it
  // that way; member names and verses are on nearly every screen.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1,
  integrations: [
    Sentry.mobileReplayIntegration({ maskAllText: true, maskAllImages: true, maskAllVectors: true }),
    Sentry.feedbackIntegration(),
  ],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

export default Sentry.wrap(function App() {
  const [fontsLoaded] = useFonts({
    Rubik_300Light,
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_600SemiBold,
    Rubik_700Bold,
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {!fontsLoaded ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.background }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
});
