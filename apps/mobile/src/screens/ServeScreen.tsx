import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { AppShell } from '../components/app/AppShell';
import { DateSelector } from '../components/app/DateSelector';
import { ListRow } from '../components/app/ListRow';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/app/EmptyState';
import { theme } from '../theme/theme';

export default function ServeScreen() {
  // Placeholder data
  const [date, setDate] = useState('Sunday, Feb 22');
  const assignments: { role: string; status: string }[] = [];
  const servicePlan = [
    { title: 'Welcome', duration: '5 min' },
    { title: 'Worship', duration: '15 min' },
    { title: 'Sermon', duration: '30 min' },
  ];
  const notes = '';

  return (
    <AppShell>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg }}>
        <DateSelector date={date} onPrev={() => {}} onNext={() => {}} />
        <Text style={{ fontWeight: theme.typography.fontWeight.bold, fontSize: theme.typography.fontSize.lg, marginBottom: theme.spacing.md }}>My Assignments</Text>
        {assignments.length === 0 ? (
          <EmptyState title="You are not scheduled this week." description="Check back for future assignments." />
        ) : (
          assignments.map((a, i) => (
            <ListRow key={i} title={a.role} badge={{ label: a.status, type: a.status === 'Confirmed' ? 'success' : a.status === 'Declined' ? 'danger' : 'default' }} />
          ))
        )}
        <Text style={{ fontWeight: theme.typography.fontWeight.bold, fontSize: theme.typography.fontSize.lg, marginVertical: theme.spacing.md }}>Service Plan Preview</Text>
        <Card>
          {servicePlan.map((item, i) => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
              <Text style={{ color: theme.colors.primaryText }}>{item.title}</Text>
              <Text style={{ color: theme.colors.muted }}>{item.duration}</Text>
            </View>
          ))}
        </Card>
        {notes ? (
          <Card>
            <Text style={{ color: theme.colors.muted }}>{notes}</Text>
          </Card>
        ) : null}
      </ScrollView>
    </AppShell>
  );
}
