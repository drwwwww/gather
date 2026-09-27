import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { palette } from "../../theme/ds";

/**
 * Motion primitives.
 *
 * This project has no Reanimated and no Lottie, so everything here is built on
 * React Native's own Animated API. Every animation below drives only `opacity`
 * and `transform`, which means `useNativeDriver: true` throughout — the work
 * happens on the UI thread and survives a busy JS thread (important during the
 * network round-trip that follows confirming an assignment).
 */

/* ────────────────────────────────────────────── Spring entrance */

export function SpringIn({
  children,
  delay = 0,
  from = 0.86,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  /** Starting scale. Below 1 pops outward, above 1 settles inward. */
  from?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.sequence([
      Animated.delay(delay),
      Animated.spring(t, {
        toValue: 1,
        friction: 7,
        tension: 68,
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [t, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: t,
          transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [from, 1] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/* ────────────────────────────────────────────── Staggered rise */

export function RiseIn({
  children,
  index = 0,
  distance = 16,
  stagger = 55,
  style,
}: {
  children: React.ReactNode;
  index?: number;
  distance?: number;
  stagger?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.sequence([
      Animated.delay(index * stagger),
      Animated.timing(t, {
        toValue: 1,
        duration: 460,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [t, index, stagger]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: t,
          transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/* ────────────────────────────────────────────── Count up */

export function CountUp({
  to,
  duration = 900,
  delay = 0,
  format = (n: number) => String(n),
  style,
}: {
  to: number;
  duration?: number;
  delay?: number;
  format?: (n: number) => string;
  style?: any;
}) {
  const [display, setDisplay] = useState(() => format(0));
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // The value has to be read on the JS side to render text, so this one
    // animation cannot use the native driver. It is a single short tween.
    const id = t.addListener(({ value }: { value: number }) => setDisplay(format(Math.round(value * to))));
    const anim = Animated.sequence([
      Animated.delay(delay),
      Animated.timing(t, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]);
    anim.start();
    return () => {
      anim.stop();
      t.removeListener(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to, duration, delay]);

  return <Animated.Text style={style}>{display}</Animated.Text>;
}

/* ────────────────────────────────────────────── Confetti */

type Piece = {
  x: number;
  delay: number;
  drift: number;
  rotations: number;
  size: number;
  color: string;
  round: boolean;
};

/**
 * Falling confetti. Deliberately restrained — muted brand tones, mixed shapes,
 * and a slow fall, so it reads as a warm acknowledgement rather than a
 * game-show payout.
 */
export function Confetti({
  count = 26,
  duration = 2600,
  origin = "top",
  colors = [palette.amber, palette.amberBright, palette.amberSoft, "#E6C99A", "#F5E1C0", palette.success],
}: {
  count?: number;
  duration?: number;
  origin?: "top" | "center";
  colors?: readonly string[];
}) {
  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: Math.random() * 100,
        delay: Math.random() * 520,
        drift: (Math.random() - 0.5) * 120,
        rotations: 1 + Math.random() * 2.5,
        size: 6 + Math.random() * 7,
        color: colors[i % colors.length],
        round: Math.random() > 0.62,
      })),
    [count, colors]
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => (
        <ConfettiPiece key={i} piece={p} duration={duration} origin={origin} />
      ))}
    </View>
  );
}

function ConfettiPiece({
  piece,
  duration,
  origin,
}: {
  piece: Piece;
  duration: number;
  origin: "top" | "center";
}) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.sequence([
      Animated.delay(piece.delay),
      Animated.timing(t, {
        toValue: 1,
        duration,
        easing: Easing.bezier(0.25, 0.6, 0.5, 1),
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [t, piece.delay, duration]);

  const startTop = origin === "top" ? -40 : 0;

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: `${piece.x}%`,
        top: origin === "top" ? 0 : "42%",
        width: piece.size,
        height: piece.round ? piece.size : piece.size * 0.5,
        borderRadius: piece.round ? piece.size / 2 : 1.5,
        backgroundColor: piece.color,
        opacity: t.interpolate({
          inputRange: [0, 0.1, 0.75, 1],
          outputRange: [0, 1, 1, 0],
        }),
        transform: [
          {
            translateY: t.interpolate({
              inputRange: [0, 1],
              outputRange: [startTop, 620],
            }),
          },
          {
            translateX: t.interpolate({
              inputRange: [0, 1],
              outputRange: [0, piece.drift],
            }),
          },
          {
            rotate: t.interpolate({
              inputRange: [0, 1],
              outputRange: ["0deg", `${piece.rotations * 360}deg`],
            }),
          },
        ],
      }}
    />
  );
}

/* ────────────────────────────────────────────── Halo pulse */

/**
 * Expanding rings behind a focal element. Two offset rings read as light
 * radiating outward — the "respectful" alternative to a bouncing mascot.
 */
export function Halo({
  size = 130,
  color = palette.amber,
  rings = 2,
  duration = 2200,
}: {
  size?: number;
  color?: string;
  rings?: number;
  duration?: number;
}) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
      {Array.from({ length: rings }).map((_, i) => (
        <HaloRing key={i} size={size} color={color} delay={(duration / rings) * i} duration={duration} />
      ))}
    </View>
  );
}

function HaloRing({
  size,
  color,
  delay,
  duration,
}: {
  size: number;
  color: string;
  delay: number;
  duration: number;
}) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(t, {
          toValue: 1,
          duration,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(t, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [t, delay, duration]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1.5,
        borderColor: color,
        opacity: t.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.5, 0] }),
        transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1.85] }) }],
      }}
    />
  );
}

/* ────────────────────────────────────────────── Press scale */

/** Returns handlers + style for a tactile press-down on any Pressable. */
export function usePressScale(to = 0.96) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: to, friction: 8, tension: 220, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, friction: 6, tension: 180, useNativeDriver: true }).start();

  return { onPressIn, onPressOut, style: { transform: [{ scale }] } };
}

/* ────────────────────────────────────────────── Shimmer (skeletons) */

export function Shimmer({ style }: { style?: StyleProp<ViewStyle> }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [t]);

  return (
    <Animated.View
      style={[
        { backgroundColor: palette.sunken, borderRadius: 14 },
        style,
        { opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }) },
      ]}
    />
  );
}
