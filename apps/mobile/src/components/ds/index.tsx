/**
 * Gather DS — "Aurora" primitives.
 * Ambient gradient screen, glass controls, floating cards, amber accent.
 */
import React from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StatusBar,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  Animated,
  Easing,
  PanResponder,
  AccessibilityInfo,
  type ImageSourcePropType,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from "react-native";
import { SafeAreaView, Edge, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Icon, AppIconName } from "../ui/Icon";
import { hueForSeed } from "../../theme/areas";
import { palette, font, gradient, radius, shadow, space, type } from "../../theme/ds";

/* ───────────────────────────────────────────── Text */

type TxtColor = "ink" | "inkSoft" | "inkMuted" | "amber" | "onDark" | "onDarkSoft" | "danger" | "success";
type TxtVariant = keyof typeof type;

const COLOR_MAP: Record<TxtColor, string> = {
  ink: palette.ink,
  inkSoft: palette.inkSoft,
  inkMuted: palette.inkMuted,
  amber: palette.amberDeep,
  onDark: palette.onDark,
  onDarkSoft: palette.onDarkSoft,
  danger: palette.danger,
  success: palette.successInk,
};

export function Txt({
  variant = "body",
  color = "ink",
  center,
  style,
  children,
  numberOfLines,
}: {
  variant?: TxtVariant;
  color?: TxtColor;
  center?: boolean;
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
  numberOfLines?: number;
}) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[type[variant] as TextStyle, { color: COLOR_MAP[color] }, center && { textAlign: "center" }, style]}
    >
      {children}
    </Text>
  );
}

/* ───────────────────────────────────────────── Screen (warm paper) */

/**
 * Flat warm-paper ground. `glow` adds Home's morning light — a soft amber
 * wash behind the greeting that fades out before the first card. Use it on
 * Home only, so it stays Home's signature.
 */
export function Screen({
  children,
  edges = ["top"],
  glow = false,
}: {
  children: React.ReactNode;
  edges?: Edge[];
  glow?: boolean;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <StatusBar barStyle="dark-content" />
      {glow && (
        <LinearGradient
          pointerEvents="none"
          colors={gradient.glow}
          locations={[0, 0.45, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.glow}
        />
      )}
      <SafeAreaView style={{ flex: 1 }} edges={edges}>
        {children}
      </SafeAreaView>
    </View>
  );
}

/* ───────────────────────────────────────────── Glass icon button */

export function GlassIconButton({
  icon,
  onPress,
  size = 44,
  iconSize = 20,
  badge,
  accessibilityLabel,
}: {
  icon: AppIconName;
  onPress?: () => void;
  size?: number;
  iconSize?: number;
  badge?: number;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      style={({ pressed }: { pressed: boolean }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: palette.glassStrong,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: palette.glassBorder,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.7 : 1,
        },
        shadow.sm,
      ]}
    >
      <Icon name={icon} size={iconSize} color={palette.ink} />
      {badge && badge > 0 ? (
        <>
          <PulseRing size={17} />
          <View style={styles.iconBadge}>
            <Text style={styles.iconBadgeTxt}>{badge > 99 ? "99+" : badge}</Text>
          </View>
        </>
      ) : null}
    </Pressable>
  );
}

/* ───────────────────────────────────────────── AppBar */

export function AppBar({
  title,
  onBack,
  right,
}: {
  title?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.appBar}>
      <View style={styles.appBarSide}>
        {onBack ? <GlassIconButton icon="chevronLeft" onPress={onBack} size={40} iconSize={22} accessibilityLabel="Back" /> : null}
      </View>
      {title ? <Text style={styles.appBarTitle} numberOfLines={1}>{title}</Text> : <View />}
      <View style={[styles.appBarSide, { alignItems: "flex-end" }]}>{right}</View>
    </View>
  );
}

/* ───────────────────────────────────────────── Cards */

export function Card({
  children,
  style,
  onPress,
  elevation = "md",
  padded = true,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  elevation?: keyof typeof shadow | "none";
  padded?: boolean;
}) {
  const base: StyleProp<ViewStyle> = [
    styles.card,
    elevation !== "none" && shadow[elevation],
    padded && { padding: space.lg },
    style,
  ];
  if (!onPress) return <View style={base}>{children}</View>;
  return <PressCard style={base} onPress={onPress}>{children}</PressCard>;
}

/** Pressable surface with a subtle scale + dim. */
export function PressCard({
  children,
  style,
  onPress,
  disabled,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const scale = React.useRef(new Animated.Value(1)).current;
  const to = (v: number) =>
    Animated.spring(scale, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  return (
    <Pressable onPress={onPress} disabled={disabled} onPressIn={() => to(0.975)} onPressOut={() => to(1)}>
      <Animated.View style={[{ transform: [{ scale }] }, style]}>{children}</Animated.View>
    </Pressable>
  );
}

/* ───────────────────────────────────────────── Button */

type BtnVariant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  label,
  onPress,
  variant = "primary",
  loading,
  disabled,
  icon,
  full = true,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: BtnVariant;
  loading?: boolean;
  disabled?: boolean;
  icon?: AppIconName;
  full?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const isDisabled = disabled || loading;
  const inner = (color: string) => (
    <View style={styles.btnInner}>
      {loading ? (
        <ActivityIndicator color={color} size="small" />
      ) : (
        <>
          {icon ? <Icon name={icon} size={18} color={color} /> : null}
          <Text style={[styles.btnLabel, { color }]}>{label}</Text>
        </>
      )}
    </View>
  );

  if (variant === "primary") {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }: { pressed: boolean }) => [
          full && { alignSelf: "stretch" },
          shadow.amber,
          { borderRadius: radius.lg, opacity: isDisabled ? 0.55 : pressed ? 0.92 : 1 },
          style,
        ]}
      >
        <LinearGradient colors={gradient.amber} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btn}>
          {inner(palette.onDark)}
        </LinearGradient>
      </Pressable>
    );
  }

  const bg =
    variant === "secondary" ? palette.glassStrong : variant === "danger" ? palette.dangerSoft : "transparent";
  const fg =
    variant === "secondary" ? palette.ink : variant === "danger" ? palette.danger : palette.amberDeep;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }: { pressed: boolean }) => [
        styles.btn,
        full && { alignSelf: "stretch" },
        { backgroundColor: bg, borderRadius: radius.lg, opacity: isDisabled ? 0.55 : pressed ? 0.85 : 1 },
        variant === "secondary" && { borderWidth: StyleSheet.hairlineWidth, borderColor: palette.glassBorder, ...shadow.sm },
        variant === "ghost" && { borderWidth: 1.5, borderColor: palette.line },
        style,
      ]}
    >
      {inner(fg)}
    </Pressable>
  );
}

/* ───────────────────────────────────────────── BrandMark */

const BRAND_MARK = require("../../../assets/brand-mark.png");

export function BrandMark({
  size = 34,
  rounding = 12,
  glow = false,
  style,
}: {
  size?: number;
  rounding?: number;
  glow?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <LinearGradient
      colors={gradient.amber}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        { width: size, height: size, borderRadius: rounding, alignItems: "center", justifyContent: "center" },
        glow && shadow.amber,
        style,
      ]}
    >
      <Image source={BRAND_MARK} style={{ width: size * 0.82, height: size * 0.82 }} resizeMode="contain" />
    </LinearGradient>
  );
}

/* ───────────────────────────────────────────── Avatar */


export function initialsOf(name?: string | null, fallback?: string | null): string {
  const src = name?.trim() || fallback?.split("@")[0] || "";
  if (!src) return "?";
  return src.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export function Avatar({
  name,
  email,
  size = 44,
  seed,
  tone,
  imageUri,
}: {
  name?: string | null;
  email?: string | null;
  size?: number;
  seed?: string;
  tone?: "amber";
  /** A real photo (local picker URI or uploaded public URL) — falls back to initials when absent. */
  imageUri?: string | null;
}) {
  // A broken or deleted photo URL falls back to initials instead of a blank circle.
  const [failedUri, setFailedUri] = React.useState<string | null>(null);
  if (imageUri && failedUri !== imageUri) {
    return (
      <Image
        source={{ uri: imageUri }}
        onError={() => setFailedUri(imageUri)}
        accessibilityIgnoresInvertColors
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: palette.sunken,
          // Neutral hairline so light photos don't bleed into white cards.
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: "rgba(0,0,0,0.1)",
        }}
      />
    );
  }

  const inits = initialsOf(name, email);
  let colors: { bg: string; fg: string };
  if (tone === "amber") {
    colors = { bg: palette.amberSoft, fg: palette.amberDeep };
  } else {
    const hue = hueForSeed(email || name || seed || "?");
    colors = { bg: hue.tint, fg: hue.ink };
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontFamily: font.bold, fontSize: size * 0.36, color: colors.fg }}>{inits}</Text>
    </View>
  );
}

/* ───────────────────────────────────────────── Pill / Badge */

type Tone = "amber" | "neutral" | "success" | "danger";

const PILL_TONES: Record<Tone, { bg: string; fg: string }> = {
  amber: { bg: palette.amberSofter, fg: palette.amberDeep },
  neutral: { bg: palette.sunken, fg: palette.inkSoft },
  success: { bg: palette.successSoft, fg: palette.successInk },
  danger: { bg: palette.dangerSoft, fg: palette.dangerInk },
};

export function Pill({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  const c = PILL_TONES[tone];
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }]}>
      <Text style={[styles.pillTxt, { color: c.fg }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>{label}</Text>
    </View>
  );
}

export function Eyebrow({ children, color = "amber" }: { children: React.ReactNode; color?: "amber" | "muted" }) {
  return (
    <Text style={[type.eyebrow, { color: color === "amber" ? palette.amberDeep : palette.inkMuted }]}>{children}</Text>
  );
}

/* ───────────────────────────────────────────── OnboardingProgress */

/**
 * One progress bar spanning the whole sign-up arc (account → photo → verse →
 * church) — account creation itself counts as real progress, so step 1 of 4
 * already reads as 25% filled, never 0%. See design-handoff/mobile/
 * member-signup-profile-builder-idea.md "Progress framing".
 */
export function OnboardingProgress({ step, total, label }: { step: number; total: number; label: string }) {
  const pct = Math.min(1, Math.max(0, step / total));
  return (
    <View style={{ marginBottom: 22 }}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
      </View>
      <Text style={styles.progressLabel}>
        Step {step} of {total} · {label}
      </Text>
    </View>
  );
}

/* ───────────────────────────────────────────── Chips (filter / segment) */

export function Chips({
  options,
  value,
  onChange,
}: {
  options: { key: string; label: string; icon?: AppIconName }[];
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <View style={styles.chipsRow}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}
          >
            {o.icon ? (
              <Icon name={o.icon} size={15} color={active ? palette.onDark : palette.inkSoft} />
            ) : null}
            <Text style={[styles.chipTxt, { color: active ? palette.onDark : palette.inkSoft }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ───────────────────────────────────────────── Stat grid */

export function StatGrid({
  items,
  columns = 3,
}: {
  items: { icon: AppIconName; label: string; value: string }[];
  columns?: number;
}) {
  return (
    <View style={styles.statGrid}>
      {items.map((s, i) => (
        <View key={i} style={[styles.statCell, { width: `${100 / columns}%` }]}>
          <View style={styles.statTop}>
            <Icon name={s.icon} size={14} color={palette.amber} />
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
          <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} maxFontSizeMultiplier={1.3}>{s.value}</Text>
        </View>
      ))}
    </View>
  );
}

/* ───────────────────────────────────────────── SectionHeader */

export function SectionHeader({
  title,
  actionLabel,
  onAction,
  style,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.sectionHeader, style]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/* ───────────────────────────────────────────── IconChip */

const ICON_CHIP_BG: Record<"amber" | "sunken" | "white", string> = {
  amber: palette.amberSofter,
  sunken: palette.sunken,
  white: palette.surface,
};
const ICON_CHIP_FG: Record<"amber" | "sunken" | "white", string> = {
  amber: palette.amber,
  sunken: palette.inkSoft,
  white: palette.amber,
};

export function IconChip({
  name,
  size = 46,
  iconSize = 22,
  tone = "amber",
}: {
  name: AppIconName;
  size?: number;
  iconSize?: number;
  tone?: "amber" | "sunken" | "white";
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.md,
        backgroundColor: ICON_CHIP_BG[tone],
        alignItems: "center",
        justifyContent: "center",
        ...(tone === "white" ? shadow.sm : null),
      }}
    >
      <Icon name={name} size={iconSize} color={ICON_CHIP_FG[tone]} />
    </View>
  );
}

/* ───────────────────────────────────────────── Motion primitives */

/** Gentle, continuous breathing scale+opacity loop — for things that want quiet attention (a countdown, a "live" cue). */
export function Pulse({
  children,
  active = true,
  minOpacity = 0.6,
  maxScale = 1.05,
  duration = 900,
  style,
}: {
  children: React.ReactNode;
  active?: boolean;
  minOpacity?: number;
  maxScale?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const anim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (!active) {
      anim.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, duration, anim]);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [1, minOpacity] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, maxScale] });

  return (
    <Animated.View style={[style, { opacity, transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  );
}

/** Expanding, fading "sonar" ring — reads as a live/unread cue behind a badge or dot. */
export function PulseRing({
  active = true,
  color = palette.amber,
  size = 17,
  duration = 1600,
}: {
  active?: boolean;
  color?: string;
  size?: number;
  duration?: number;
}) {
  const anim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (!active) return;
    anim.setValue(0);
    const loop = Animated.loop(
      Animated.timing(anim, { toValue: 1, duration, easing: Easing.out(Easing.ease), useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [active, duration, anim]);

  if (!active) return null;

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 2] });
  const opacity = anim.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0.55, 0.4, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 2,
        right: 2,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ scale }],
      }}
    />
  );
}

/** One-time staggered fade+rise entrance — call `active` once your data is ready so a list "assembles" instead of popping in. */
export function Reveal({
  children,
  index = 0,
  active = true,
  style,
}: {
  children: React.ReactNode;
  index?: number;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const anim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (!active) return;
    Animated.timing(anim, {
      toValue: 1,
      duration: 420,
      delay: index * 70,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [active, index, anim]);

  const opacity = active ? anim : 1;
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });

  return (
    <Animated.View style={[style, { opacity, transform: active ? [{ translateY }] : undefined }]}>
      {children}
    </Animated.View>
  );
}

/* ───────────────────────────────────────────── Toast */

/**
 * In-app banner (iOS in-app notification / Slack / Instagram pattern): compact,
 * content-led, one line of context + one line of content.
 * - Leading visual is the content itself — the post's photo, or the event's date
 *   tile — not a generic icon. Falls back to an icon chip.
 * - `eyebrow` names what it is ("News", "New event") in its area colour; the title
 *   is the thing (the post's title), `subtitle` a one-line preview.
 * - Tap opens it; swipe up (or wait 5 s) dismisses. No × — a 18pt close glyph was a
 *   sub-44pt target and duplicated the swipe. Holding a finger on it pauses the timer.
 * - Announced to screen readers; Reduce Motion fades instead of sliding.
 */
export type ToastPayload = {
  title: string;
  subtitle?: string;
  /** Short label above the title, e.g. "News". */
  eyebrow?: string;
  /** Colour for the eyebrow / date tile / icon chip. */
  accent?: { tint: string; ink: string };
  /** A thumbnail (remote `{ uri }` or a `require()`d asset). */
  image?: ImageSourcePropType;
  /** A calendar tile instead of a thumbnail. */
  date?: { month: string; day: string };
  icon?: AppIconName;
  onPress?: () => void;
};

type QueuedToast = ToastPayload & { id: number };

type ToastContextValue = { showToast: (payload: ToastPayload) => void };
const ToastContext = React.createContext<ToastContextValue>({ showToast: () => {} });

/** Call from anywhere under `ToastProvider` to enqueue a top banner toast. Toasts queue and show one at a time. */
export function useToast() {
  return React.useContext(ToastContext);
}

/** Mount once near the root (inside a NavigationContainer if toasts should navigate). */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = React.useState<QueuedToast[]>([]);
  const idRef = React.useRef(0);

  const showToast = React.useCallback((payload: ToastPayload) => {
    idRef.current += 1;
    setQueue((q) => [...q, { ...payload, id: idRef.current }]);
  }, []);

  const dismissCurrent = React.useCallback(() => {
    setQueue((q) => q.slice(1));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastHost toast={queue[0] ?? null} onDismiss={dismissCurrent} />
    </ToastContext.Provider>
  );
}

const TOAST_MS = 5000;

function ToastHost({ toast, onDismiss }: { toast: QueuedToast | null; onDismiss: () => void }) {
  const insets = useSafeAreaInsets();
  const anim = React.useRef(new Animated.Value(0)).current;
  const drag = React.useRef(new Animated.Value(0)).current;
  const [rendered, setRendered] = React.useState<QueuedToast | null>(null);
  const [reduceMotion, setReduceMotion] = React.useState(false);
  const hideRef = React.useRef<() => void>(() => {});
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
  }, []);

  const startTimer = React.useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => hideRef.current(), TOAST_MS);
  }, []);
  const pauseTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  React.useEffect(() => {
    if (!toast) return;
    let dismissed = false;
    setRendered(toast);
    drag.setValue(0);
    anim.setValue(0);
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, damping: 22, mass: 0.8, stiffness: 260 }).start();
    AccessibilityInfo.announceForAccessibility([toast.eyebrow, toast.title, toast.subtitle].filter(Boolean).join(". "));

    hideRef.current = () => {
      if (dismissed) return;
      dismissed = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      Animated.timing(anim, { toValue: 0, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => {
        setRendered(null);
        onDismiss();
      });
    };

    startTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  // One responder for the whole banner: a tap opens it, a flick up dismisses it,
  // a downward pull rubber-bands back. (A Pressable inside a PanResponder fought
  // over the touch and swipes never registered.)
  const [pressed, setPressed] = React.useState(false);
  const renderedRef = React.useRef<QueuedToast | null>(null);
  renderedRef.current = rendered;
  const pan = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pauseTimer();
        setPressed(true);
      },
      onPanResponderMove: (_e: GestureResponderEvent, g: PanResponderGestureState) => drag.setValue(g.dy < 0 ? g.dy : g.dy / 4),
      onPanResponderRelease: (_e: GestureResponderEvent, g: PanResponderGestureState) => {
        setPressed(false);
        if (g.dy < -24 || g.vy < -0.4) {
          hideRef.current();
        } else if (Math.abs(g.dx) < 8 && Math.abs(g.dy) < 8) {
          renderedRef.current?.onPress?.();
          hideRef.current();
        } else {
          Animated.spring(drag, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 300 }).start();
          startTimer();
        }
      },
      onPanResponderTerminate: () => {
        setPressed(false);
        Animated.spring(drag, { toValue: 0, useNativeDriver: true }).start();
        startTimer();
      },
    })
  ).current;

  if (!rendered) return null;

  const slide = anim.interpolate({ inputRange: [0, 1], outputRange: [reduceMotion ? 0 : -(insets.top + 80), 0] });
  const accent = rendered.accent ?? { tint: palette.sunken, ink: palette.inkSoft };

  return (
    <Animated.View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        paddingTop: insets.top + 6,
        paddingHorizontal: 10,
        opacity: reduceMotion ? anim : 1,
        transform: [{ translateY: Animated.add(slide, drag) }],
      }}
    >
      <View
        {...pan.panHandlers}
        accessible
        accessibilityRole="button"
        accessibilityHint={rendered.onPress ? "Opens it. Swipe up to dismiss." : "Swipe up to dismiss."}
        accessibilityActions={[{ name: "activate" }, { name: "escape" }, { name: "dismiss", label: "Dismiss" }]}
        onAccessibilityAction={(e: { nativeEvent: { actionName: string } }) => {
          if (e.nativeEvent.actionName === "activate") rendered.onPress?.();
          hideRef.current();
        }}
        style={[styles.toastCard, pressed && { transform: [{ scale: 0.98 }] }]}
      >
        {rendered.image ? (
          <Image source={rendered.image} style={styles.toastThumb} resizeMode="cover" accessibilityIgnoresInvertColors />
        ) : rendered.date ? (
          <View style={[styles.toastThumb, styles.toastDate, { backgroundColor: accent.tint }]}>
            <Text style={[styles.toastDateMonth, { color: accent.ink }]}>{rendered.date.month}</Text>
            <Text style={[styles.toastDateDay, { color: accent.ink }]}>{rendered.date.day}</Text>
          </View>
        ) : (
          <View style={[styles.toastThumb, styles.toastDate, { backgroundColor: accent.tint }]}>
            <Icon name={rendered.icon ?? "notifications"} size={20} color={accent.ink} />
          </View>
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.toastTop}>
            {rendered.eyebrow ? (
              <Text style={[styles.toastEyebrow, { color: rendered.accent ? accent.ink : palette.inkSoft }]} numberOfLines={1}>
                {rendered.eyebrow}
              </Text>
            ) : null}
            <Text style={styles.toastNow}>now</Text>
          </View>
          <Text style={styles.toastTitle} numberOfLines={1} maxFontSizeMultiplier={1.4}>{rendered.title}</Text>
          {rendered.subtitle ? (
            <Text style={styles.toastSubtitle} numberOfLines={1} maxFontSizeMultiplier={1.4}>{rendered.subtitle}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.toastGrabber} />
    </Animated.View>
  );
}

/* ───────────────────────────────────────────── CenterCardModal */

/** A centered, dimmed-backdrop welcome/celebration card — for rare, meaningful one-time moments (first assignment, first church joined). Not for routine alerts; use Toast for those. */
export function CenterCardModal({
  visible,
  onClose,
  imageUri,
  icon,
  eyebrow,
  title,
  body,
  primaryLabel,
  onPrimaryPress,
  secondaryLabel,
  onSecondaryPress,
}: {
  visible: boolean;
  onClose: () => void;
  imageUri?: string;
  icon?: AppIconName;
  eyebrow?: string;
  title: string;
  body: string;
  primaryLabel: string;
  onPrimaryPress: () => void;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
}) {
  const anim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (!visible) return;
    anim.setValue(0);
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, damping: 15, mass: 0.9, stiffness: 170 }).start();
  }, [visible, anim]);

  if (!visible) return null;

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] });

  return (
    <View style={styles.centerOverlay} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: "#150A00", opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] }) }]}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.centerCard, { opacity: anim, transform: [{ scale }] }]}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.centerCardImage} resizeMode="cover" />
        ) : icon ? (
          <View style={styles.centerCardIconWrap}>
            <IconChip name={icon} tone="amber" size={64} iconSize={30} />
          </View>
        ) : null}

        <Pressable onPress={onClose} style={styles.centerCardClose} hitSlop={8} accessibilityLabel="Close">
          <Icon name="close" size={16} color={palette.onDark} />
        </Pressable>

        <View style={{ padding: space.gutter }}>
          {eyebrow ? <Text style={styles.centerCardEyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.centerCardTitle}>{title}</Text>
          <Text style={styles.centerCardBody}>{body}</Text>
          <View style={{ marginTop: 20, gap: 10 }}>
            <Button label={primaryLabel} onPress={onPrimaryPress} />
            {secondaryLabel ? (
              <Button label={secondaryLabel} variant="ghost" onPress={onSecondaryPress ?? onClose} />
            ) : null}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

/* ───────────────────────────────────────────── EmptyState */

export function EmptyState({
  icon = "calendar",
  title,
  body,
}: {
  icon?: AppIconName;
  title: string;
  body?: string;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon name={icon} size={28} color={palette.amber} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {body ? <Text style={styles.emptyBody}>{body}</Text> : null}
    </View>
  );
}

export function Loader({ style }: { style?: StyleProp<ViewStyle> }) {
  return <ActivityIndicator size="large" color={palette.amber} style={[{ marginTop: 48 }, style]} />;
}

export function Divider({ inset = 0 }: { inset?: number }) {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: palette.line, marginLeft: inset }} />;
}

const styles = StyleSheet.create({
  glow: { position: "absolute", top: 0, left: 0, right: 0, height: 340 },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: palette.sunken, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: palette.amber },
  progressLabel: { fontFamily: font.semibold, fontSize: 12, color: palette.inkMuted, marginTop: 8, letterSpacing: 0.2 },

  toastCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: palette.surface,
    borderRadius: 20,
    paddingVertical: 11,
    paddingLeft: 11,
    paddingRight: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(28,25,23,0.08)",
    shadowColor: "#1C1917",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  toastThumb: { width: 44, height: 44, borderRadius: 12, backgroundColor: palette.sunken },
  toastDate: { alignItems: "center", justifyContent: "center" },
  toastDateMonth: { fontFamily: font.bold, fontSize: 9, letterSpacing: 0.6, lineHeight: 11 },
  toastDateDay: { fontFamily: font.bold, fontSize: 17, lineHeight: 20 },
  toastTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  toastEyebrow: { flexShrink: 1, fontFamily: font.semibold, fontSize: 12, lineHeight: 16 },
  toastNow: { marginLeft: "auto", fontFamily: font.regular, fontSize: 12, lineHeight: 16, color: palette.inkMuted },
  toastTitle: { fontFamily: font.semibold, fontSize: 15, lineHeight: 20, color: palette.ink, marginTop: 1 },
  toastSubtitle: { fontFamily: font.regular, fontSize: 13.5, lineHeight: 18, color: palette.inkSoft },
  toastGrabber: { alignSelf: "center", width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(28,25,23,0.12)", marginTop: 6 },

  centerOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    zIndex: 1000,
    elevation: 20,
  },
  centerCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
    overflow: "hidden",
    ...shadow.lg,
  },
  centerCardImage: { width: "100%", height: 160, backgroundColor: palette.sunken },
  centerCardIconWrap: { alignItems: "center", justifyContent: "center", paddingTop: 28 },
  centerCardClose: {
    position: "absolute",
    top: 12, right: 12,
    width: 30, height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  centerCardEyebrow: { fontFamily: font.bold, fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: palette.amberDeep, marginBottom: 6 },
  centerCardTitle: { fontFamily: font.bold, fontSize: 20, color: palette.ink, lineHeight: 26 },
  centerCardBody: { fontFamily: font.regular, fontSize: 14, color: palette.inkSoft, marginTop: 8, lineHeight: 20 },

  iconBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    backgroundColor: palette.amber,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: palette.surface,
  },
  iconBadgeTxt: { fontFamily: font.bold, fontSize: 9, color: palette.onDark },

  appBar: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.gutter,
  },
  appBarSide: { minWidth: 64, justifyContent: "center" },
  appBarTitle: { fontFamily: font.bold, fontSize: 17, color: palette.ink },

  card: { backgroundColor: palette.surface, borderRadius: radius.xl },

  btn: {
    minHeight: 54,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.lg,
  },
  btnInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  btnLabel: { fontFamily: font.bold, fontSize: 16 },

  pill: { borderRadius: radius.chip, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start", flexShrink: 0 },
  pillTxt: { fontFamily: font.bold, fontSize: 11, letterSpacing: 0.3 },

  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
  },
  chipIdle: { backgroundColor: palette.glassStrong, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.glassBorder },
  chipActive: { backgroundColor: palette.amber, ...shadow.amber },
  chipTxt: { fontFamily: font.semibold, fontSize: 13.5 },

  statGrid: { flexDirection: "row", flexWrap: "wrap" },
  statCell: { paddingVertical: 12, paddingRight: 8 },
  statTop: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 5 },
  statLabel: { fontFamily: font.medium, fontSize: 12, color: palette.inkMuted },
  statValue: { fontFamily: font.bold, fontSize: 18, color: palette.ink, letterSpacing: -0.3 },

  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  sectionTitle: { fontFamily: font.bold, fontSize: 19, color: palette.ink, letterSpacing: -0.3 },
  sectionAction: { fontFamily: font.bold, fontSize: 14, color: palette.amberDeep },

  empty: { alignItems: "center", paddingTop: 56, paddingHorizontal: 32 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: palette.amberSofter,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: { fontFamily: font.bold, fontSize: 18, color: palette.ink, marginBottom: 6, textAlign: "center" },
  emptyBody: { fontFamily: font.regular, fontSize: 14, color: palette.inkMuted, textAlign: "center", lineHeight: 20 },
});

export { palette, font, gradient, radius, shadow, space, type } from "../../theme/ds";
export { LinearGradient };
