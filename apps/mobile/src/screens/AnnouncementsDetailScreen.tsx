import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { AppShell } from '../components/app/AppShell';
import { Card } from '../components/ui/Card';
import { theme } from '../theme/theme';

export default function AnnouncementsDetailScreen({ route }: any) {
  const { announcement } = route.params;
  return (
    <AppShell>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg }}>
        <Card>
          <Text style={{ fontWeight: theme.typography.fontWeight.bold, fontSize: theme.typography.fontSize.lg }}>{announcement.title}</Text>
          <Text style={{ color: theme.colors.muted, marginBottom: theme.spacing.sm }}>{announcement.date}</Text>
          <Text style={{ color: theme.colors.primaryText }}>{announcement.message}</Text>
        </Card>
      </ScrollView>
    </AppShell>
  );
}
