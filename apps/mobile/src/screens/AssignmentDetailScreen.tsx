import { View, Text, ScrollView, Image, TouchableOpacity } from "react-native";
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { AppShell } from '../components/app/AppShell';
import { theme } from '../theme/theme';

export default function AssignmentDetailScreen({ route, navigation }: any) {
  const { assignmentId } = route.params;

  return (
    <AppShell>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md, paddingHorizontal: theme.spacing.lg }}>
        <View>
          <Text style={{
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.fontSize.title,
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.primaryText,
          }}>Assignment Detail</Text>
          <Text style={{
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.fontSize.md,
            color: theme.colors.muted,
          }}>ID: {assignmentId}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation?.navigate?.('ProfileMenu')} style={{ marginLeft: theme.spacing.md, marginTop: 2 }} accessibilityLabel="Open profile menu">
          <Image source={require('../../assets/logo.png')} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.secondary }} />
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: theme.spacing.xl, paddingHorizontal: theme.spacing.lg }}>
        <Card>
          <Text style={{ fontWeight: theme.typography.fontWeight.bold, fontSize: theme.typography.fontSize.lg, color: theme.colors.primaryText }}>Sound Engineer</Text>
          <Text style={{ color: theme.colors.muted }}>Sunday 9:00 AM · Main Sanctuary</Text>
          <Button style={{ marginTop: theme.spacing.md }} onPress={() => {}}>Confirm</Button>
          <Button style={{ marginTop: theme.spacing.sm }} onPress={() => {}} variant="secondary">Decline</Button>
        </Card>
        {/* TODO: Map real assignment details here */}
      </ScrollView>
    </AppShell>
  );
}
