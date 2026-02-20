import { View, Text, ScrollView, Image, TouchableOpacity } from "react-native";
import { Card } from '../components/ui/Card';
import { theme } from '../theme/theme';
import { AppShell } from '../components/app/AppShell';

export default function AnnouncementsScreen({ navigation }: any) {
  return (
    <AppShell>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md, paddingHorizontal: theme.spacing.lg }}>
        <View>
          <Text style={{
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.fontSize.title,
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.primaryText,
          }}>Announcements</Text>
          <Text style={{
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.fontSize.md,
            color: theme.colors.muted,
          }}>Latest church updates.</Text>
        </View>
        <TouchableOpacity onPress={() => navigation?.navigate?.('ProfileMenu')} style={{ marginLeft: theme.spacing.md, marginTop: 2 }} accessibilityLabel="Open profile menu">
          <Image source={require('../../assets/logo.png')} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.secondary }} />
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: theme.spacing.xl, paddingHorizontal: theme.spacing.lg }}>
        <Card>
          <Text style={{ fontWeight: theme.typography.fontWeight.bold, fontSize: theme.typography.fontSize.lg, color: theme.colors.primaryText }}>Welcome to Gather</Text>
          <Text style={{ color: theme.colors.muted }}>Thanks for joining our community.</Text>
        </Card>
        {/* TODO: Map real announcements here, styled as cards */}
      </ScrollView>
    </AppShell>
  );
}
