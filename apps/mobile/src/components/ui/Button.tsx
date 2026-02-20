import React from 'react';
import { Pressable, Text } from 'react-native';
import { StyleSheet } from 'react-native';
type ViewStyle = any;
type TextStyle = any;
import { theme } from '../../theme/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export function Button({ children, onPress, variant = 'primary', style, textStyle, disabled }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled}
    >
      <Text style={[styles.text, styles[`${variant}Text`], textStyle]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    marginVertical: theme.spacing.xs,
  },
  primary: {
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeight.medium,
    fontSize: theme.typography.fontSize.md,
  },
  primaryText: {
    color: theme.colors.primaryText,
  },
  secondaryText: {
    color: theme.colors.primaryText,
  },
  ghostText: {
    color: theme.colors.primaryText,
  },
});
