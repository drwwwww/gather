import { View, Text } from "react-native";
import { Icon } from "../ui/Icon";
import { theme } from "../../theme/theme";

type Props = {
  /** Stacked (sign-in hero) vs horizontal (home app bar). */
  layout?: "stacked" | "row";
  /** Smaller row for tight headers. */
  compact?: boolean;
  /**
   * Tab / main screens (Stitch `screen-10-serve.html`): amber church icon + “Gather”
   * with no circle — matches HTML header row.
   */
  flat?: boolean;
};

export function GatherMark({ layout = "stacked", compact = false, flat = false }: Props) {
  const iconSize = compact ? 22 : 32;
  const circle = compact ? 40 : 64;
  const titleSize = compact ? 22 : 28;

  if (layout === "row" && flat) {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Icon name="church" size={24} color={theme.colors.primary} />
        <Text
          style={{
            fontFamily: theme.typography.fontFamily,
            fontSize: 28,
            fontWeight: theme.typography.fontWeight.bold as any,
            color: theme.colors.primaryText,
            letterSpacing: -0.5,
          }}
        >
          Gather
        </Text>
      </View>
    );
  }

  if (layout === "row") {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{
            width: circle,
            height: circle,
            borderRadius: circle / 2,
            backgroundColor: theme.colors.primarySoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="church" size={iconSize} color={theme.colors.primary} />
        </View>
        <Text
          style={{
            fontFamily: theme.typography.fontFamily,
            fontSize: titleSize,
            fontWeight: theme.typography.fontWeight.bold as any,
            color: theme.colors.primaryText,
            letterSpacing: -0.5,
          }}
        >
          Gather
        </Text>
      </View>
    );
  }

  return (
    <View style={{ alignItems: "center", marginBottom: theme.spacing.md }}>
      <View
        style={{
          width: circle,
          height: circle,
          borderRadius: circle / 2,
          backgroundColor: theme.colors.primarySoft,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: theme.spacing.sm,
        }}
      >
        <Icon name="church" size={iconSize} color={theme.colors.primary} />
      </View>
      <Text
        style={{
          fontFamily: theme.typography.fontFamily,
          fontSize: titleSize,
          fontWeight: theme.typography.fontWeight.bold as any,
          color: theme.colors.primaryText,
          letterSpacing: -0.5,
        }}
      >
        Gather
      </Text>
    </View>
  );
}
