import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';

export function DateSelector({ date, onPrev, onNext }: { date: string; onPrev: () => void; onNext: () => void }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onPrev} style={styles.arrow}><Text style={styles.arrowText}>{'<'}</Text></TouchableOpacity>
      <Text style={styles.date}>{date}</Text>
      <TouchableOpacity onPress={onNext} style={styles.arrow}><Text style={styles.arrowText}>{'>'}</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: theme.spacing.md,
  },
  date: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primaryText,
    marginHorizontal: theme.spacing.lg,
  },
  arrow: {
    padding: theme.spacing.sm,
  },
  arrowText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.primary,
  },
});
