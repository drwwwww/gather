import { useRef, useState } from "react";
import {
  View, Text, Pressable, Animated, Platform, useWindowDimensions, StyleSheet,
  NativeSyntheticEvent, NativeScrollEvent,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Icon, type AppIconName } from "../components/ui/Icon";
import { Screen, Button, Mark, palette, font, radius, shadow, space } from "../components/ds";
import { MEMBER_TABS, SERVE_TABS, type TabDef } from "../components/app/TabBar";
import { useAuth } from "../context/AuthContext";
import { useReduceMotion } from "../hooks/useReduceMotion";

type Slide = {
  key: string;
  title: string;
  body: string;
  /** Which real tab this slide is about — drawn as a miniature tab bar. */
  tab?: string;
  hero?: "brand" | AppIconName;
};

const MEMBER_SLIDES: Slide[] = [
  {
    key: "welcome",
    hero: "brand",
    title: "Welcome to Gather",
    body: "Your church's news, events and people — in one calm place.",
  },
  {
    key: "news",
    tab: "Announcements",
    title: "News from your church",
    body: "Announcements land here first. If one goes out while you're in the app, you'll see it right away.",
  },
  {
    key: "events",
    tab: "Events",
    title: "RSVP in a tap",
    body: "See what's coming up — at your church and at churches nearby — and let them know you're coming.",
  },
];

const SERVE_SLIDES: Slide[] = [
  {
    key: "serve",
    tab: "Serve",
    title: "Your serving schedule",
    body: "When you're scheduled, it shows up here. Confirm or decline in one tap so your team knows where things stand.",
  },
  {
    key: "plan",
    tab: "ServicePlan",
    title: "Sunday's plan",
    body: "The order of service and who's on the team. On the day, tap Check in when you arrive.",
  },
];

const CLOSING: Slide = {
  key: "done",
  hero: "checkCircle",
  title: "You're all set",
  body: "Replay this tour any time from your profile.",
};

/** A miniature of the real tab bar with the slide's tab lit — shows exactly
    where to tap, using the same icons and labels as the bar below. */
function TabPreview({ tabs, activeKey }: { tabs: TabDef[]; activeKey: string }) {
  return (
    <View style={styles.preview} accessible accessibilityLabel={`${tabs.find((t) => t.key === activeKey)?.label} tab`}>
      {tabs.map((t) => {
        const on = t.key === activeKey;
        return (
          <View key={t.key} style={styles.previewItem}>
            <View style={[styles.previewIcon, on && styles.previewIconOn]}>
              <Icon name={t.icon} size={22} color={on ? palette.amberInk : palette.inkMuted} />
            </View>
            <Text style={[styles.previewLabel, on && styles.previewLabelOn]} numberOfLines={1}>
              {t.shortLabel}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function SlideView({
  slide, index, width, scrollX, tabs, reduceMotion,
}: {
  slide: Slide; index: number; width: number; scrollX: Animated.Value; tabs: TabDef[]; reduceMotion: boolean;
}) {
  // One quiet motion only: the illustration drifts at a slower rate than the
  // page (light parallax). No idle bobbing, no rotation, text stays fully
  // legible throughout the swipe.
  const range = [(index - 1) * width, index * width, (index + 1) * width];
  const drift = reduceMotion
    ? 0
    : scrollX.interpolate({ inputRange: range, outputRange: [width * 0.25, 0, -width * 0.25], extrapolate: "clamp" });

  return (
    <View style={[styles.slide, { width }]}>
      <Animated.View style={[styles.stage, { transform: [{ translateX: drift as any }] }]}>
        {slide.tab ? (
          <TabPreview tabs={tabs} activeKey={slide.tab} />
        ) : slide.hero === "brand" ? (
          <Mark height={68} />
        ) : slide.hero ? (
          <View style={styles.heroChip}>
            <Icon name={slide.hero} size={40} color={palette.amberInk} />
          </View>
        ) : null}
      </Animated.View>

      <View style={styles.copy}>
        <Text style={styles.title} accessibilityRole="header">{slide.title}</Text>
        <Text style={styles.body}>{slide.body}</Text>
      </View>
    </View>
  );
}

export default function GuidedTourScreen({ navigation }: any) {
  const { profile } = useAuth();
  const reduceMotion = useReduceMotion();
  const serves = profile?.role === "SERVICE" || profile?.role === "ADMIN";
  const tabs = serves ? SERVE_TABS : MEMBER_TABS;
  const slides: Slide[] = [...MEMBER_SLIDES, ...(serves ? SERVE_SLIDES : []), CLOSING];

  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<any>(null);
  const isFirst = page === 0;
  const isLast = page === slides.length - 1;

  const goToPage = (i: number) => {
    const next = Math.max(0, Math.min(slides.length - 1, i));
    scrollRef.current?.scrollTo({ x: next * width, animated: !reduceMotion });
    if (next !== page) {
      setPage(next);
      Haptics.selectionAsync().catch(() => {});
    }
  };

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== page) {
      setPage(i);
      Haptics.selectionAsync().catch(() => {});
    }
  };

  const finish = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate("MainTabs", { screen: "Home" });
  };

  return (
    <Screen edges={["top", "bottom"]}>
      <View style={styles.topRow}>
        <Text style={styles.counter} accessibilityLiveRegion="polite">
          {page + 1} of {slides.length}
        </Text>
        {!isLast ? (
          <Pressable
            onPress={finish}
            hitSlop={space.sm}
            accessibilityRole="button"
            accessibilityLabel="Skip tour"
            style={({ pressed }: { pressed: boolean }) => [styles.skip, pressed && { opacity: 0.55 }]}
          >
            <Text style={styles.skipTxt}>Skip</Text>
          </Pressable>
        ) : null}
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
        onMomentumScrollEnd={onMomentumEnd}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {slides.map((slide, i) => (
          <SlideView key={slide.key} slide={slide} index={i} width={width} scrollX={scrollX} tabs={tabs} reduceMotion={reduceMotion} />
        ))}
      </Animated.ScrollView>

      <View style={styles.bottom}>
        {/* Segmented progress: completed segments filled, so position reads at a glance. */}
        <View style={styles.progress} accessible={false}>
          {slides.map((s, i) => (
            <Pressable
              key={s.key}
              onPress={() => goToPage(i)}
              hitSlop={{ top: space.md, bottom: space.md }}
              style={styles.segmentHit}
              accessibilityRole="button"
              accessibilityLabel={`Go to step ${i + 1}`}
            >
              <View style={[styles.segment, i <= page && styles.segmentOn]} />
            </Pressable>
          ))}
        </View>

        <View style={styles.actions}>
          {!isFirst ? (
            <Button label="Back" variant="ghost" full={false} onPress={() => goToPage(page - 1)} style={styles.backBtn} />
          ) : null}
          <View style={{ flex: 1 }}>
            <Button
              label={isLast ? "Start using Gather" : "Next"}
              onPress={isLast ? finish : () => goToPage(page + 1)}
            />
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: space.gutter, minHeight: 44,
  },
  counter: { fontFamily: font.medium, fontSize: 13, color: palette.inkMuted },
  skip: { minHeight: 44, minWidth: 44, alignItems: "flex-end", justifyContent: "center" },
  skipTxt: { fontFamily: font.semibold, fontSize: 15, color: palette.inkSoft },

  slide: { flex: 1, paddingHorizontal: space.xl, justifyContent: "center" },
  stage: { height: 180, alignItems: "center", justifyContent: "center" },
  heroChip: {
    width: 88, height: 88, borderRadius: radius.lg, backgroundColor: palette.amberSofter,
    alignItems: "center", justifyContent: "center",
  },
  copy: { marginTop: space.xl, alignItems: "center" },
  title: {
    fontFamily: font.bold, fontSize: 26, lineHeight: 32, letterSpacing: -0.4,
    color: palette.ink, textAlign: "center",
  },
  body: {
    fontFamily: font.regular, fontSize: 16, lineHeight: 24, color: palette.inkSoft,
    textAlign: "center", marginTop: space.md, maxWidth: 320,
  },

  preview: {
    flexDirection: "row", alignSelf: "stretch", backgroundColor: palette.surface,
    borderRadius: radius.lg, paddingVertical: space.md, paddingHorizontal: space.sm,
    borderWidth: StyleSheet.hairlineWidth, borderColor: palette.line,
    ...Platform.select({ ios: shadow.md, android: { elevation: 3 }, default: shadow.md }),
  },
  previewItem: { flex: 1, alignItems: "center", gap: space.xs },
  previewIcon: { width: 44, height: 32, borderRadius: radius.chip, alignItems: "center", justifyContent: "center" },
  previewIconOn: { backgroundColor: palette.amberSofter },
  previewLabel: { fontFamily: font.medium, fontSize: 11, color: palette.inkMuted },
  previewLabelOn: { fontFamily: font.semibold, color: palette.amberInk },

  bottom: { paddingHorizontal: space.gutter, paddingBottom: space.sm, gap: space.lg },
  progress: { flexDirection: "row", gap: space.xs },
  segmentHit: { flex: 1, justifyContent: "center" },
  segment: { height: 4, borderRadius: 2, backgroundColor: palette.line },
  segmentOn: { backgroundColor: palette.amber },
  actions: { flexDirection: "row", alignItems: "center", gap: space.md },
  backBtn: { paddingHorizontal: space.xl },
});
