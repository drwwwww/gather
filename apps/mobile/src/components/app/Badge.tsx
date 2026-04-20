import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';

export function Badge({ label, type = 'default' }: { label: string; type?: 'default' | 'gold' | 'success' | 'danger' }) {
  let backgroundColor = theme.colors.secondary;
  let color = theme.colors.primaryText;
  if (type === 'gold') {
    backgroundColor = theme.colors.primary;
    color = theme.colors.onPrimary;
  }
  if (type === 'success') {
    backgroundColor = theme.colors.successSoft;
    color = theme.colors.successOnSoft;
  }
  if (type === 'danger') {
    backgroundColor = theme.colors.danger;
    color = theme.colors.onPrimary;
  }
  return (
    <View style={[styles.badge, { backgroundColor }]}> 
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.xs,
    minHeight: 22,
  },
  text: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
});
