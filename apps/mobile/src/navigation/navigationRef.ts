import { createNavigationContainerRef } from "@react-navigation/native";

/**
 * Lets code outside the navigator tree (toast taps, background hooks) trigger
 * navigation. Attach via `<NavigationContainer ref={navigationRef}>` in
 * AppNavigator — `useNavigation()` doesn't work for components that aren't
 * descendants of a Screen, which AppOverlays isn't.
 */
export const navigationRef = createNavigationContainerRef();

export function navigate(name: string, params?: object) {
  if (navigationRef.isReady()) {
    (navigationRef.navigate as (name: string, params?: object) => void)(name, params);
  }
}
