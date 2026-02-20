
import { AppShell } from '../components/app/AppShell';
import { Card } from '../components/ui/Card';

export default function ProfileScreen() {
  return (
    <AppShell>
      <View style={{ marginBottom: theme.spacing.md, paddingHorizontal: theme.spacing.lg }}>
        <Text style={{
          fontFamily: theme.typography.fontFamily,
          fontSize: theme.typography.fontSize.title,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.primaryText,
        }}>Profile</Text>
        <Text style={{
          fontFamily: theme.typography.fontFamily,
          fontSize: theme.typography.fontSize.md,
          color: theme.colors.muted,
        }}>Preferences and profile settings.</Text>
      </View>
      <Card>
        <Text style={{ fontWeight: theme.typography.fontWeight.bold, fontSize: theme.typography.fontSize.lg, color: theme.colors.primaryText }}>Account</Text>
        <Text style={{ color: theme.colors.muted }}>Member · Joined 2024</Text>
      </Card>
      <Card>
        <Text style={{ fontWeight: theme.typography.fontWeight.bold, fontSize: theme.typography.fontSize.lg, color: theme.colors.primaryText }}>Notifications</Text>
        <Text style={{ color: theme.colors.muted }}>Event reminders enabled.</Text>
      </Card>
    </AppShell>
  );
}
