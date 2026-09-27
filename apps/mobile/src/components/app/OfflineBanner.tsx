import { useEffect, useRef, useState } from "react";
import { Animated, Text, StyleSheet } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { palette, font } from "../ds";

/** Slim banner across the top whenever the device loses connectivity —
    every screen otherwise fails silently (blank list, spinner that never
    resolves) with no indication of why. */
export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOffline(state.isConnected === false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: offline ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [offline, anim]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        {
          paddingTop: insets.top + 6,
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) }],
        },
      ]}
    >
      <Text style={styles.txt}>You're offline — showing saved data</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    paddingBottom: 8,
    alignItems: "center",
    backgroundColor: palette.ink,
  },
  txt: { fontFamily: font.semibold, fontSize: 12.5, color: palette.onDark },
});
