import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { AppShell } from '../components/app/AppShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { theme } from '../theme/theme';

export default function ProfileMenuScreen({ navigation }: any) {
  // Placeholder user data
  const user = { name: 'Jane Doe', email: 'jane@email.com', role: 'Volunteer', church: 'Grace Church' };
  return (
    <AppShell>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg }}>
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginBottom: theme.spacing.md }}>
            <Button onPress={() => navigation.goBack()} variant="secondary">Back</Button>
          </View>
          <Text style={{ fontWeight: theme.typography.fontWeight.bold, fontSize: theme.typography.fontSize.lg }}>{user.name}</Text>
          <Text style={{ color: theme.colors.muted }}>{user.email}</Text>
          <Text style={{ color: theme.colors.primary }}>{user.role}</Text>
          <Text style={{ color: theme.colors.muted, marginBottom: theme.spacing.md }}>{user.church}</Text>
          <Button onPress={() => { /* sign out logic */ }} variant="secondary">Sign out</Button>
        </Card>
      </ScrollView>
    </AppShell>
  );
}
