import React from "react";
import { View, type ViewStyle } from "react-native";
import { theme } from "../../theme/theme";

export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[{ height: 1, backgroundColor: theme.colors.divider, width: "100%" }, style]} />;
}

