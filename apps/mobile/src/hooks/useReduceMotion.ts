import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/** Tracks the OS "Reduce Motion" setting, including changes while the app is open. */
export function useReduceMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => subscription.remove();
  }, []);

  return reduced;
}
