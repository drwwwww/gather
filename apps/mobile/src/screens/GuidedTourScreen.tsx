import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Animated, Easing, useWindowDimensions, StyleSheet, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import type { AppIconName } from "../components/ui/Icon";
import { Screen, Txt, Button, IconChip, PulseRing, palette, font } from "../components/ds";
import { useAuth } from "../context/AuthContext";

type Slide = { icon: AppIconName; title: string; body: string };

const BASE_SLIDES: Slide[] = [
  {
    icon: "church",
    title: "Welcome to Gather",
    body: "Everything about your church community lives here — announcements, events, and your people, all in one calm place.",
  },
  {
    icon: "announcements",
    title: "Stay in the loop",
    body: "New announcements show up on Home and under the Announcements tab. You'll get a toast the moment one goes out while you're in the app.",
  },
  {
    icon: "events",
    title: "RSVP in a tap",
    body: "Browse upcoming events and let your church know you're coming — right from the event's detail screen.",
  },
];

const SERVE_SLIDE: Slide = {
  icon: "serve",
  title: "Manage your schedule",
  body: "When you're on the schedule, you'll find it under the Serve tab — confirm or decline, and see exactly what you're serving in.",
};

const CLOSING_SLIDE: Slide = {
  icon: "checkCircle",
  title: "You're all set",
  body: "That's the whole tour. Explore at your own pace — everything here is easy to find again from the Home tab.",
};

/** Idle up/down bob so a slide's icon feels alive even when nobody's swiping. */
function useFloat() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  return anim.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
}

function SlideView({ slide, index, width, scrollX, isClosing }: { slide: Slide; index: number; width: number; scrollX: Animated.Value; isClosing?: boolean }) {
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
  const iconScale = scrollX.interpolate({ inputRange, outputRange: [0.55, 1, 0.55], extrapolate: "clamp" });
  const iconRotate = scrollX.interpolate({ inputRange, outputRange: ["-8deg", "0deg", "8deg"], extrapolate: "clamp" });
  const iconOpacity = scrollX.interpolate({ inputRange, outputRange: [0.25, 1, 0.25], extrapolate: "clamp" });
  // Floor raised well above 0 and the range narrowed — this used to hit full
  // gray-out for most of the swipe, which read as low-contrast/hard to read
  // rather than a subtle motion cue. The rise (translateY) still does the
  // visible "arriving" motion; opacity now only lightly accents it.
  const narrowRange = [(index - 0.6) * width, index * width, (index + 0.6) * width];
  const contentOpacity = scrollX.interpolate({ inputRange: narrowRange, outputRange: [0.55, 1, 0.55], extrapolate: "clamp" });
  const contentTranslateY = scrollX.interpolate({ inputRange, outputRange: [16, 0, 16], extrapolate: "clamp" });
  const floatY = useFloat();

  return (
    <View style={[styles.slide, { width }]}>
      <View style={styles.iconStage}>
        {isClosing ? <PulseRing size={96} color={palette.amber} /> : null}
        <Animated.View
          style={{
            opacity: iconOpacity,
            transform: [{ scale: iconScale }, { rotate: iconRotate }, { translateY: floatY }],
          }}
        >
          <IconChip name={slide.icon} tone="amber" size={96} iconSize={44} />
        </Animated.View>
      </View>
      <Animated.View style={{ opacity: contentOpacity, transform: [{ translateY: contentTranslateY }] }}>
        <Txt variant="h1" center style={{ marginTop: 28, marginBottom: 12 }}>{slide.title}</Txt>
        <Txt variant="body" color="inkSoft" center style={{ maxWidth: 300, lineHeight: 22, alignSelf: "center" }}>{slide.body}</Txt>
      </Animated.View>
    </View>
  );
}

function Dot({ index, page, width, scrollX, onPress }: { index: number; page: number; width: number; scrollX: Animated.Value; onPress: () => void }) {
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
  // `width` isn't animatable on the native driver — only transform/opacity are.
  // scaleX on a fixed-size dot gives the same "worm" grow effect (and the
  // stretched circle reading as a pill is exactly the look we want anyway).
  const dotScaleX = scrollX.interpolate({ inputRange, outputRange: [1, 3, 1], extrapolate: "clamp" });
  const dotOpacity = scrollX.interpolate({ inputRange, outputRange: [0.35, 1, 0.35], extrapolate: "clamp" });
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <Animated.View style={[styles.dot, { opacity: dotOpacity, transform: [{ scaleX: dotScaleX }] }]} />
    </Pressable>
  );
}

export default function GuidedTourScreen({ navigation }: any) {
  const { profile } = useAuth();
  const showServe = profile?.role === "SERVICE" || profile?.role === "ADMIN";
  const slides: Slide[] = [...BASE_SLIDES, ...(showServe ? [SERVE_SLIDE] : []), CLOSING_SLIDE];

  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  // `any` here, not sloppiness: this project's react-native type resolution is
  // broken project-wide (pre-existing, unrelated to this screen — see other
  // files' identical "no exported member" errors), so ScrollView's instance
  // type doesn't resolve cleanly either way. .scrollTo() is standard RN.
  const scrollRef = useRef<any>(null);
  const isLast = page === slides.length - 1;

  const goToPage = (i: number) => {
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
    setPage(i);
  };

  const onScrollJS = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== page) setPage(i);
  };

  const finish = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate("MainTabs", { screen: "Home" });
  };

  return (
    <Screen edges={["top", "bottom"]}>
      <View style={{ flex: 1 }}>
        <View style={styles.topRow}>
          <View style={{ flex: 1 }} />
          {!isLast ? (
            <Pressable onPress={finish} hitSlop={10}>
              <Text style={styles.skip}>Skip</Text>
            </Pressable>
          ) : null}
        </View>

        <Animated.ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true, listener: onScrollJS }
          )}
          scrollEventThrottle={16}
          style={{ flex: 1 }}
        >
          {slides.map((slide, i) => (
            <SlideView key={i} slide={slide} index={i} width={width} scrollX={scrollX} isClosing={i === slides.length - 1 && isLast} />
          ))}
        </Animated.ScrollView>

        <View style={styles.bottom}>
          <View style={styles.dots}>
            {slides.map((_, i) => (
              <Dot key={i} index={i} page={page} width={width} scrollX={scrollX} onPress={() => goToPage(i)} />
            ))}
          </View>
          <Button
            label={isLast ? "Get started" : "Next"}
            onPress={isLast ? finish : () => goToPage(page + 1)}
            icon={isLast ? undefined : "arrowRight"}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 24, height: 44 },
  skip: { fontFamily: font.semibold, fontSize: 14, color: palette.inkMuted },
  slide: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  iconStage: { alignItems: "center", justifyContent: "center" },
  bottom: { paddingHorizontal: 28, paddingBottom: 8, gap: 20 },
  dots: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: palette.amber },
});
