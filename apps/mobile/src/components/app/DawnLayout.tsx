import type { ReactNode } from "react";
import { Image, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient, font, gradient, shadow } from "../ds";

/** The logo on its own (heart over three people), tinted with the dawn ink. */
const GLYPH = require("../../../assets/brand-glyph.png");

/** Dark brown for text on the amber — white on amber is ~2:1, this is ~8:1. */
/** Deep amber-brown taken from the sunrise itself — dark enough to read (6:1 on the sun), soft enough not to look black. */
export const DAWN_INK = "#7A4A0C";
/** For small bold text on solid amber (CTA pills), where the lighter ink would dip under 4.5:1. */
export const DAWN_INK_STRONG = "#5C3405";
const SHEET = "#FBFAF7";

/**
 * Sign-in / sign-up ground: an amber sunrise (the same "Dawn" moment as the
 * web auth transition) fading into a cream sheet that holds the form.
 * Static — no motion, so nothing to switch off under Reduce Motion.
 */
export default function DawnLayout({
  topLeft,
  tagline = "Your church, together",
  children,
}: {
  topLeft?: ReactNode;
  tagline?: string;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={gradient.dawn}
        locations={[0, 0.3, 0.55, 0.8]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* The sun: two soft discs behind the mark. */}
      <View pointerEvents="none" style={[styles.sunOuter, { top: insets.top + 6 }]} />
      <View pointerEvents="none" style={[styles.sunInner, { top: insets.top + 56 }]} />

      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
        <View style={styles.topRow}>{topLeft ?? <View style={{ width: 44 }} />}</View>
        <View style={styles.brand}>
          <Image source={GLYPH} style={styles.glyph} resizeMode="contain" accessible={false} />
          <Text style={styles.name} accessibilityRole="header">Gather</Text>
          <Text style={styles.tagline}>{tagline}</Text>
        </View>

        <KeyboardAvoidingView style={styles.sheetWrap} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={[styles.sheet, shadow.lg]}>
            <ScrollView
              bounces={false}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            >
              {children}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SHEET },
  sunOuter: {
    position: "absolute",
    alignSelf: "center",
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: "rgba(255,240,205,0.38)",
  },
  sunInner: {
    position: "absolute",
    alignSelf: "center",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(255,246,226,0.45)",
  },
  topRow: { paddingHorizontal: 20, paddingTop: 8, height: 52, justifyContent: "center" },
  brand: { alignItems: "center", paddingTop: 4, paddingBottom: 24, flexShrink: 1 },
  // Aspect of brand-glyph.png (214×172); the mark alone, no amber tile.
  glyph: { width: 112, height: 90, tintColor: DAWN_INK },
  // Same face and ink as the tagline, just larger — a quiet name, not a heavy wordmark.
  name: { fontFamily: font.medium, fontSize: 22, letterSpacing: -0.2, color: DAWN_INK, marginTop: 14 },
  tagline: { fontFamily: font.medium, fontSize: 15, color: DAWN_INK, marginTop: 2 },
  sheetWrap: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    backgroundColor: SHEET,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 26,
    maxHeight: "100%",
  },
});
