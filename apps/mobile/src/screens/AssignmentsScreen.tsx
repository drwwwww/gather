import { View, Text, ScrollView, Image, TouchableOpacity } from "react-native";
import { Card } from '../components/ui/Card';
import { AppShell } from '../components/app/AppShell';
import { theme } from '../theme/theme';

export default function AssignmentsScreen({ navigation }: any) {
  const assignmentId = "demo-assignment";

  return (
    <AppShell>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md, paddingHorizontal: theme.spacing.lg }}>
        <View>
          <Text style={{
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.fontSize.title,
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.primaryText,
          }}>Upcoming Assignments</Text>
          <Text style={{
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.fontSize.md,
            color: theme.colors.muted,
          }}>Service team roles needing your response.</Text>
        </View>
        <TouchableOpacity onPress={() => navigation?.navigate?.('ProfileMenu')} style={{ marginLeft: theme.spacing.md, marginTop: 2 }} accessibilityLabel="Open profile menu">
          <Image source={require('../../assets/logo.png')} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.secondary }} />
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: theme.spacing.xl, paddingHorizontal: theme.spacing.lg }}>
        <TouchableOpacity onPress={() => navigation.navigate('AssignmentDetail', { assignmentId })} activeOpacity={0.85} style={{ marginBottom: theme.spacing.md }}>
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: theme.typography.fontWeight.bold, fontSize: theme.typography.fontSize.lg, color: theme.colors.primaryText }}>Sunday 9AM</Text>
              <View style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radii.xl, paddingHorizontal: theme.spacing.sm, paddingVertical: 2, marginLeft: theme.spacing.sm }}>
                <Text style={{ color: theme.colors.primaryText, fontWeight: theme.typography.fontWeight.bold, fontSize: theme.typography.fontSize.sm }}>ASSIGNED</Text>
              </View>
            </View>
            <Text style={{ color: theme.colors.muted, marginTop: theme.spacing.xs }}>Sound Engineer</Text>
          </Card>
        </TouchableOpacity>
        {/* TODO: Map real assignments here, styled as cards */}
      </ScrollView>
    </AppShell>
  );
}
