
import { View, Text, ScrollView, Image, TouchableOpacity } from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { theme } from '../theme/theme';
const Icon = (props) => <MaterialIcons {...props} />;
import { AppShell } from '../components/app/AppShell';

export default function HomeScreen({ navigation }: any) {
  return (
    <AppShell>
      <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ paddingBottom: 96 }}>
        {/* Header Section */}
        <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xl, paddingBottom: theme.spacing.lg, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: theme.colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, overflow: 'hidden', borderWidth: 2, borderColor: theme.colors.primary, marginRight: theme.spacing.md }}>
              <Image source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB6Aeozpn0AF5gZHEox4vCjyxP9HPPGEk4-RZwbR33chVDmjiRl_xIxKZ8ah3YL5jkgCLVpjGDyS5A_wxcgn4zBKSiDBYqinJFO04gBBLTMjlSkDyCt0-B0grPe0hnW4VG7JE3yKTRV_Yan-5y0uAe4ml6G_YbA9dg4NNFEQ7AGropuX1w8C5Ybycfm1Xty2ORyiXTtKhuYWTkpqctJwaccmmDGN5cE4mU99V-s2ThCgy1Rqpjn1tqXN8IYK12isoxB15Fb1EmJ9cvj' }} style={{ width: '100%', height: '100%' }} />
            </View>
            <View>
              <Text style={{ fontSize: 14, color: theme.colors.muted, fontWeight: '500' }}>Good morning,</Text>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors.primaryText }}>Sarah Jenkins</Text>
            </View>
          </View>
          <TouchableOpacity style={{ position: 'relative', padding: 8, borderRadius: 24, backgroundColor: '#F5F5F4', borderWidth: 0 }}>
            <MaterialIcons name="notifications-none" size={24} color="#78716C" />
            <Icon name="notifications-none" size={24} color="#78716C" />
            <View style={{ position: 'absolute', top: 4, right: 4, width: 10, height: 10, backgroundColor: theme.colors.primary, borderRadius: 5, borderWidth: 2, borderColor: '#fff' }} />
          </TouchableOpacity>
        </View>

        {/* Message of the Day Card */}
        <View style={{ margin: theme.spacing.lg }}>
          <View style={{ backgroundColor: '#fff', borderLeftWidth: 4, borderLeftColor: theme.colors.primary, borderRadius: theme.radii.xl, padding: theme.spacing.lg, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, position: 'relative' }}>
            <View style={{ position: 'absolute', top: 0, right: 0, opacity: 0.1, padding: theme.spacing.md }}>
              <Text style={{ fontFamily: 'MaterialIcons', fontSize: 48, color: theme.colors.primary }}>format_quote</Text>
            </View>
            <Text style={{ fontSize: 12, color: theme.colors.primary, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8 }}>Message of the Day</Text>
            <Text style={{ fontSize: 18, fontStyle: 'italic', color: theme.colors.primaryText, marginBottom: 4 }}>
              "Let all that you do be done in love."
            </Text>
            <Text style={{ fontSize: 14, color: theme.colors.muted }}>— 1 Corinthians 16:14</Text>
          </View>
        </View>

        {/* Quick Access Grid */}
        <View style={{ marginHorizontal: theme.spacing.lg, marginBottom: theme.spacing.xl }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: theme.spacing.md }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.primaryText }}>Quick Access</Text>
            <TouchableOpacity>
              <Text style={{ fontSize: 12, color: theme.colors.primary, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 0 }}>
            <View style={{ width: '48%' }}>
              <TouchableOpacity style={{ marginBottom: theme.spacing.md, backgroundColor: '#fff', borderRadius: theme.radii.xl, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.lg, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: theme.colors.primary + '33', alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.sm }}>
                  <MaterialIcons name="people" size={28} color={theme.colors.primary} />
                    <Icon name="people" size={28} color={theme.colors.primary} />
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.primaryText }}>Members</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ marginBottom: theme.spacing.md, backgroundColor: '#fff', borderRadius: theme.radii.xl, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.lg, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: theme.colors.primary + '33', alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.sm }}>
                  <MaterialIcons name="groups" size={28} color={theme.colors.primary} />
                    <Icon name="groups" size={28} color={theme.colors.primary} />
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.primaryText }}>Groups</Text>
              </TouchableOpacity>
            </View>
            <View style={{ width: '48%' }}>
              <TouchableOpacity style={{ marginBottom: theme.spacing.md, backgroundColor: '#fff', borderRadius: theme.radii.xl, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.lg, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: theme.colors.primary + '33', alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.sm }}>
                  <MaterialIcons name="favorite" size={28} color={theme.colors.primary} />
                    <Icon name="favorite" size={28} color={theme.colors.primary} />
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.primaryText }}>Donations</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ marginBottom: theme.spacing.md, backgroundColor: '#fff', borderRadius: theme.radii.xl, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.lg, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: theme.colors.primary + '33', alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.sm }}>
                  <MaterialIcons name="event" size={28} color={theme.colors.primary} />
                    <Icon name="event" size={28} color={theme.colors.primary} />
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.primaryText }}>Calendar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Upcoming Events Section */}
        <View style={{ marginHorizontal: theme.spacing.lg, marginBottom: theme.spacing.xl }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.primaryText }}>Upcoming Events</Text>
            <TouchableOpacity style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }}>
              <MaterialIcons name="add" size={18} color="#fff" />
                <Icon name="add" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={{ marginBottom: 0 }}>
            {/* Event Card 1 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#E6D3B5', padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } }}>
              <View style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: '#CACAAA22', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#78716C', textTransform: 'uppercase' }}>Oct</Text>
                <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#2B241C', lineHeight: 24 }}>22</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: 'bold', color: '#2B241C', fontSize: 16 }}>Sunday Morning Service</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                  <MaterialIcons name="schedule" size={14} color="#7B735D" style={{ marginRight: 4 }} />
                    <Icon name="schedule" size={14} color="#7B735D" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 12, color: '#7B735D' }}>9:00 AM • Main Hall</Text>
                </View>
              </View>
              <TouchableOpacity style={{ padding: 8 }}>
                <MaterialIcons name="chevron-right" size={24} color={theme.colors.primary} />
                  <Icon name="chevron-right" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
            {/* Event Card 2 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#E6D3B5', padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } }}>
              <View style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: '#CACAAA22', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#78716C', textTransform: 'uppercase' }}>Oct</Text>
                <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#2B241C', lineHeight: 24 }}>24</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: 'bold', color: '#2B241C', fontSize: 16 }}>Youth Group Meetup</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                  <MaterialIcons name="schedule" size={14} color="#7B735D" style={{ marginRight: 4 }} />
                    <Icon name="schedule" size={14} color="#7B735D" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 12, color: '#7B735D' }}>6:30 PM • Basement Hub</Text>
                </View>
              </View>
              <TouchableOpacity style={{ padding: 8 }}>
                <MaterialIcons name="chevron-right" size={24} color={theme.colors.primary} />
                  <Icon name="chevron-right" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
            {/* Event Card 3 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#E6D3B5', padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } }}>
              <View style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: '#CACAAA22', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#78716C', textTransform: 'uppercase' }}>Oct</Text>
                <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#2B241C', lineHeight: 24 }}>27</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: 'bold', color: '#2B241C', fontSize: 16 }}>Food Drive</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                  <MaterialIcons name="schedule" size={14} color="#7B735D" style={{ marginRight: 4 }} />
                    <Icon name="schedule" size={14} color="#7B735D" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 12, color: '#7B735D' }}>10:00 AM • Community Plaza</Text>
                </View>
              </View>
              <TouchableOpacity style={{ padding: 8 }}>
                <MaterialIcons name="chevron-right" size={24} color={theme.colors.primary} />
                  <Icon name="chevron-right" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Attendance Stats Card */}
        <View style={{ marginHorizontal: theme.spacing.lg, marginBottom: theme.spacing.xl }}>
          <View style={{ backgroundColor: theme.colors.primary + '1A', borderRadius: theme.radii.xl, padding: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.primary + '33' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.primaryText }}>This Month's Attendance</Text>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: theme.colors.primary }}>+12%</Text>
            </View>
            <View style={{ width: '100%', height: 8, borderRadius: 4, backgroundColor: '#E6D3B5', overflow: 'hidden', marginBottom: theme.spacing.sm }}>
              <View style={{ width: '80%', height: '100%', backgroundColor: theme.colors.primary, borderRadius: 4 }} />
            </View>
            <Text style={{ fontSize: 10, color: theme.colors.muted, textAlign: 'center', fontStyle: 'italic', marginTop: theme.spacing.sm }}>Goal: 500 Active Members</Text>
          </View>
        </View>
      </ScrollView>
    </AppShell>
  );
}
