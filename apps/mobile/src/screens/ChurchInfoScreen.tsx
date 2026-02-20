import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { AppShell } from '../components/app/AppShell';
import { Card } from '../components/ui/Card';
import { theme } from '../theme/theme';

export default function ChurchInfoScreen() {
  // Placeholder church info
  const church = { name: 'Grace Church', joinCode: 'ABCD1234' };
  return (
    <AppShell>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg }}>
        <Card>
          <Text style={{ fontWeight: theme.typography.fontWeight.bold, fontSize: theme.typography.fontSize.lg }}>{church.name}</Text>
          <Text style={{ color: theme.colors.muted, marginBottom: theme.spacing.md }}>Join Code: {church.joinCode}</Text>
          {/* QR code could go here */}
        </Card>
      </ScrollView>
    </AppShell>
  );
}
