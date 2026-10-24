import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

/**
 * Default art for an event or announcement with no photo of its own: a deep
 * area colour, a soft lighter circle, and the Gather heart mark in white.
 * Replaced the stock church photos (2026-10), which were tight close-ups that
 * crowded every card. The colour is picked from the record's id, so the same
 * post always looks the same and neighbours usually differ. The web
 * announcement preview (AnnouncementBrowser `AppBrandArt`) mirrors this — same
 * colours, same hash — keep the two in step.
 */
const MARK_GLYPH = require("../../../assets/brand-glyph.png");

export const BRAND_ART_COLORS = [
  { bg: "#6B2F6A", glow: "#A0529F" }, // plum
  { bg: "#0B5E57", glow: "#009B90" }, // teal
  { bg: "#8A3A12", glow: "#D46A2E" }, // clay
  { bg: "#1E447F", glow: "#3466B8" }, // blue
  { bg: "#7A4508", glow: "#F59E0B" }, // amber
  { bg: "#44591A", glow: "#6E8F2E" }, // olive
] as const;

export function brandArtColors(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return BRAND_ART_COLORS[h % BRAND_ART_COLORS.length];
}

export default function BrandArt({
  seed,
  style,
  compact = false,
}: {
  seed: string;
  style?: StyleProp<ViewStyle>;
  /** Small thumbnails: just the mark, centred. */
  compact?: boolean;
}) {
  const c = brandArtColors(seed);
  return (
    <View style={[styles.base, { backgroundColor: c.bg }, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {compact ? null : <View style={[styles.glow, { backgroundColor: c.glow }]} />}
      <View style={[StyleSheet.absoluteFill, compact ? styles.center : styles.right]}>
        {/* The box carries the size (a View honours aspectRatio everywhere); the
            image fills it. An Image sized by % alone keeps its intrinsic width
            on react-native-web — same class of bug as fillImg in HomeScreen. */}
        <View style={compact ? styles.markBoxCompact : styles.markBox}>
          <Image source={MARK_GLYPH} style={[StyleSheet.absoluteFill as any, styles.fill, { tintColor: "rgba(255,255,255,0.92)" }]} resizeMode="contain" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { overflow: "hidden" },
  glow: { position: "absolute", width: "75%", aspectRatio: 1, borderRadius: 9999, right: "-14%", top: "-30%", opacity: 0.55 },
  right: { alignItems: "flex-end", justifyContent: "center", paddingRight: "11%" },
  center: { alignItems: "center", justifyContent: "center" },
  markBox: { height: "40%", aspectRatio: 1.25 },
  markBoxCompact: { height: "46%", aspectRatio: 1.25 },
  fill: { width: "100%", height: "100%" },
});
