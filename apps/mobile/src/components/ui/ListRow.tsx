import React from "react";
import { View, TouchableOpacity, type ViewStyle } from "react-native";
import { theme } from "../../theme/theme";
import { Icon, type AppIconName } from "./Icon";
import { Text } from "./Text";

export function ListRow({
  title,
  subtitle,
  leftIcon,
  rightChevron = true,
  onPress,
  style
}: {
  title: string;
  subtitle?: string;
  leftIcon?: AppIconName;
  rightChevron?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  const Container = onPress ? TouchableOpacity : View;
  return (
    <Container
      onPress={onPress as any}
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderRadius: theme.radii.lg,
          backgroundColor: theme.colors.card,
          borderWidth: 1,
          borderColor: theme.colors.border
        },
        style
      ]}
      accessibilityRole={onPress ? "button" : undefined}
      activeOpacity={0.85}
    >
      <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
        {leftIcon ? (
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.primarySoft, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
            <Icon name={leftIcon} size={18} color={theme.colors.primaryHover} />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text variant="body" numberOfLines={1} style={{ fontWeight: theme.typography.fontWeight.semibold as any }}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="muted" numberOfLines={2} style={{ marginTop: 2 }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {rightChevron ? <Icon name="chevronRight" size={18} color={theme.colors.textMuted} /> : null}
    </Container>
  );
}

