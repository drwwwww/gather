import React, { useEffect, useRef } from "react";
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Icon } from "../ui/Icon";
import { LinearGradient } from "../ds";
import { Confetti, CountUp, Halo, RiseIn, SpringIn } from "../ds/motion";
import { font, gradient, palette, radius, shadow, space } from "../../theme/ds";

export type CelebrationStat = {
  label: string;
  value: number;
  /** Rendered around the counted value, e.g. "%" or "×". */
  suffix?: string;
  icon: React.ComponentProps<typeof Icon>["name"];
  tone: "amber" | "success" | "info";
};

const TONES = {
  amber: { bg: palette.amberSofter, border: palette.amberSoft, ink: palette.amberDeep },
  success: { bg: palette.successSoft, border: "#BFEBD5", ink: palette.successInk },
  info: { bg: "#EDF3FE", border: "#D3E2FC", ink: "#2C5BB5" },
} as const;

/**
 * Post-confirmation celebration.
 *
 * Modelled on Duolingo's lesson-complete screen — a held beat that makes the
 * action feel worth doing, with stat tiles and a single primary button. The
 * expression is deliberately different: no mascot and no bounce, but light
 * radiating from a struck checkmark, warm confetti, and language that thanks
 * rather than congratulates. A volunteer saying yes to serving should feel
 * honoured, not scored.
 */
export default function ConfirmCelebration({
  visible,
  title,
  subtitle,
  roleLine,
  stats,
  onDismiss,
}: {
  visible: boolean;
  title: string;
  subtitle: string;
  /** e.g. "Worship Leader · Sun 9:00 AM" */
  roleLine?: string;
  stats: CelebrationStat[];
  onDismiss: () => void;
}) {
  const check = useRef(new Animated.Value(0)).current;
  const sheen = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      check.setValue(0);
      sheen.setValue(0);
      return;
    }
    const anim = Animated.sequence([
      Animated.delay(120),
      Animated.parallel([
        // Overshoot then settle — the "struck" feel, without a cartoon bounce.
        Animated.spring(check, { toValue: 1, friction: 5.5, tension: 90, useNativeDriver: true }),
        Animated.timing(sheen, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]);
    anim.start();
    return () => anim.stop();
  }, [visible, check, sheen]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss} statusBarTranslucent>
      <View style={styles.backdrop}>
        <LinearGradient
          colors={["#FFFDF8", "#FFF4E2", "#FDEEDF"]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {visible ? <Confetti count={30} /> : null}

        <View style={styles.body}>
          {/* Focal mark */}
          <View style={styles.markWrap}>
            <Halo size={148} rings={2} />
            <Animated.View
              style={[
                styles.markRing,
                {
                  opacity: check,
                  transform: [
                    { scale: check.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }) },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={gradient.sunset}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.markInner}
              >
                <Icon name="check" size={44} color={palette.onDark} strokeWidth={3} />
              </LinearGradient>
              {/* A single light sweep across the mark as it lands. */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.sheen,
                  {
                    opacity: sheen.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.5, 0] }),
                    transform: [
                      { rotate: "22deg" },
                      { translateX: sheen.interpolate({ inputRange: [0, 1], outputRange: [-90, 90] }) },
                    ],
                  },
                ]}
              />
            </Animated.View>
          </View>

          <RiseIn index={1}>
            <Text style={styles.title}>{title}</Text>
          </RiseIn>
          <RiseIn index={2}>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </RiseIn>

          {roleLine ? (
            <RiseIn index={3}>
              <View style={styles.rolePill}>
                <Icon name="serve" size={13} color={palette.amberDeep} />
                <Text style={styles.roleTxt} numberOfLines={1}>
                  {roleLine}
                </Text>
              </View>
            </RiseIn>
          ) : null}

          {/* Stat tiles */}
          <View style={styles.statRow}>
            {stats.map((s, i) => {
              const tone = TONES[s.tone];
              return (
                <SpringIn key={s.label} delay={420 + i * 110} style={{ flex: 1 }}>
                  <View style={[styles.statTile, { borderColor: tone.border }]}>
                    <View style={[styles.statCap, { backgroundColor: tone.bg }]}>
                      <Text style={[styles.statLabel, { color: tone.ink }]} numberOfLines={1}>
                        {s.label}
                      </Text>
                    </View>
                    <View style={styles.statValueRow}>
                      <Icon name={s.icon} size={15} color={tone.ink} />
                      <CountUp
                        to={s.value}
                        delay={520 + i * 110}
                        format={(n) => `${n}${s.suffix ?? ""}`}
                        style={[styles.statValue, { color: tone.ink }]}
                      />
                    </View>
                  </View>
                </SpringIn>
              );
            })}
          </View>
        </View>

        <RiseIn index={6} style={styles.footer}>
          <Pressable
            onPress={onDismiss}
            style={({ pressed }: { pressed: boolean }) => [styles.cta, pressed && { opacity: 0.9, transform: [{ scale: 0.985 }] }]}
          >
            <LinearGradient
              colors={gradient.sunset}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaInner}
            >
              <Text style={styles.ctaTxt}>You&apos;re all set</Text>
            </LinearGradient>
          </Pressable>
        </RiseIn>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  body: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 },

  markWrap: { width: 148, height: 148, alignItems: "center", justifyContent: "center", marginBottom: 30 },
  markRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    padding: 5,
    backgroundColor: palette.surface,
    overflow: "hidden",
    ...shadow.amber,
  },
  markInner: { flex: 1, borderRadius: 48, alignItems: "center", justifyContent: "center" },
  sheen: {
    position: "absolute",
    top: -30,
    left: 20,
    width: 26,
    height: 170,
    backgroundColor: "rgba(255,255,255,0.9)",
  },

  title: {
    fontFamily: font.bold,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.6,
    color: palette.ink,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: font.regular,
    fontSize: 15,
    lineHeight: 22,
    color: palette.inkSoft,
    textAlign: "center",
    marginTop: 10,
    maxWidth: 300,
  },

  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    alignSelf: "center",
    marginTop: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: palette.amberSofter,
  },
  roleTxt: { fontFamily: font.semibold, fontSize: 13, color: palette.amberDeep },

  statRow: { flexDirection: "row", gap: 10, marginTop: 34, alignSelf: "stretch" },
  statTile: {
    borderRadius: radius.lg,
    borderWidth: 2,
    backgroundColor: palette.surface,
    overflow: "hidden",
    ...shadow.sm,
  },
  statCap: { paddingVertical: 6, alignItems: "center" },
  statLabel: {
    fontFamily: font.bold,
    fontSize: 9.5,
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 13,
  },
  statValue: { fontFamily: font.bold, fontSize: 19, letterSpacing: -0.3 },

  footer: { paddingHorizontal: space.gutter, paddingBottom: 44 },
  cta: { borderRadius: radius.lg, overflow: "hidden", ...shadow.amber },
  ctaInner: { paddingVertical: 17, alignItems: "center", borderRadius: radius.lg },
  ctaTxt: {
    fontFamily: font.bold,
    fontSize: 15.5,
    color: palette.onDark,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
});
