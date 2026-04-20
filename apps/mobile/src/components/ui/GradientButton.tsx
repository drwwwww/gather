import { Pressable, Text, type ViewStyle, type StyleProp } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../../theme/theme";

type Props = {
  children: string;
  onPress: () => void;
  disabled?: boolean;
  /** Stitch assignment cards: smaller pill (`screen-10-serve.html`). */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Primary CTA — amber gradient (Stitch “amber aura”). */
export function GradientButton({ children, onPress, disabled, compact, style }: Props) {
  const padV = compact ? 12 : 18;
  const padH = compact ? theme.spacing.md : theme.spacing.lg;
  const fontSize = compact ? theme.typography.fontSize.sm : theme.typography.fontSize.lg;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          borderRadius: 9999,
          overflow: "hidden",
          opacity: disabled ? 0.5 : pressed ? 0.92 : 1,
          transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryHover]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingVertical: padV,
          paddingHorizontal: padH,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            fontFamily: theme.typography.fontFamily,
            fontSize,
            fontWeight: theme.typography.fontWeight.bold as any,
            color: theme.colors.onPrimary,
          }}
        >
          {children}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}
