import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { StyleSheet } from 'react-native';
type ViewStyle = any;
import { theme } from '../../theme/theme';
import { Badge } from './Badge';

export function ListRow({
  title,
  subtitle,
  badge,
  onPress,
  style,
  right,
}: {
  title: string;
  subtitle?: string;
  badge?: { label: string; type?: 'default' | 'gold' | 'success' | 'danger' };
  onPress?: () => void;
  style?: ViewStyle;
  right?: React.ReactNode;
}) {
  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} style={[styles.row, style]}> 
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {badge ? <Badge label={badge.label} type={badge.type} /> : null}
      {right}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.lg,
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primaryText,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.muted,
  },
});
