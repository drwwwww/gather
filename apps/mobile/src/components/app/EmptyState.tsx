import React from 'react';
import { View, Text } from 'react-native';
import { StyleSheet } from 'react-native';
import { Button } from '../ui/Button';
import { theme } from '../../theme/theme';

export function EmptyState({ title, description, actionLabel, onAction }: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <Button onPress={onAction} variant="secondary" style={{ marginTop: theme.spacing.md }}>{actionLabel}</Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    marginTop: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primaryText,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  description: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.muted,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
});
