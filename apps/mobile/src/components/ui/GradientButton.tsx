import { Pressable, Text, View, type ViewStyle, type StyleProp } from "react-native";
import { theme } from "../../theme/theme";

type Props = {
  children: string;
  onPress: () => void;
  disabled?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function GradientButton({ children, onPress, disabled, compact, style }: Props) {
  const padV = compact ? 12 : 16;
  const padH = compact ? theme.spacing.md : theme.spacing.lg;
  const fontSize = compact ? theme.typography.fontSize.sm : theme.typography.fontSize.md;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          borderRadius: 12,
          overflow: "hidden",
          opacity: disabled ? 0.5 : 1,
          transform: [{ scale: pressed && !disabled ? 0.97 : 1 }],
        },
        style,
      ]}
    >
      <View
        style={{
          backgroundColor: disabled ? theme.colors.primaryHover : theme.colors.primary,
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
      </View>
    </Pressable>
  );
}
