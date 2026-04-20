import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../../theme/theme";
import { Icon } from "../ui/Icon";

export type AssignmentChip = { key: string; label: string };

/**
 * Stitch bulletin “Your Assignments” hero — amber aura gradient, chips, watermark icon.
 * Shared so Bulletin and other surfaces can reuse the same treatment.
 */
export function YourAssignmentsBanner({
  chips,
  subtitle,
}: {
  chips: AssignmentChip[];
  /** Optional override; defaults to a short readiness line from chip count. */
  subtitle?: string;
}) {
  const count = chips.length;
  const line =
    subtitle ??
    (count === 1
      ? "You have 1 part or role for this service. Please be ready before we begin."
      : `You have ${count} parts or roles for this service. Please be ready before we begin.`);

  return (
    <View style={{ borderRadius: theme.radii.lg, overflow: "hidden", marginBottom: 8 }}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryHover]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          padding: 24,
          paddingVertical: 28,
        }}
      >
        <View style={{ position: "absolute", right: -36, top: -36, opacity: 0.12 }} pointerEvents="none">
          <Icon name="volunteer" size={160} color="#FFFFFF" />
        </View>

        <View style={{ position: "relative", zIndex: 1 }}>
          <Text
            style={{
              fontFamily: theme.typography.fontFamily,
              fontSize: 22,
              fontWeight: theme.typography.fontWeight.bold as any,
              color: theme.colors.onPrimary,
              marginBottom: 4,
            }}
          >
            Your assignments
          </Text>
          <Text
            style={{
              fontFamily: theme.typography.fontFamily,
              fontSize: theme.typography.fontSize.md,
              lineHeight: 22,
              color: "rgba(255,255,255,0.9)",
              maxWidth: "92%",
            }}
          >
            {line}
          </Text>

          {chips.length > 0 ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
              {chips.map((c) => (
                <View
                  key={c.key}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: "rgba(255,255,255,0.22)",
                  }}
                >
                  <Icon name="schedule" size={14} color="#FFFFFF" />
                  <Text
                    style={{
                      fontFamily: theme.typography.fontFamily,
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.semibold as any,
                      color: theme.colors.onPrimary,
                      maxWidth: 220,
                    }}
                    numberOfLines={1}
                  >
                    {c.label}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </LinearGradient>
    </View>
  );
}
