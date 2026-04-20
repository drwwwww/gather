import { useCallback, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Image } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { theme } from "../theme/theme";
import { AppShell } from "../components/app/AppShell";
import { StitchTabAppBar } from "../components/app/StitchTabAppBar";
import { STITCH_PAD_H, stitchEditorialPanel, stitchPrimaryFixedBg, stitchRowShadowSoft } from "../theme/stitch";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";
import { Icon } from "../components/ui/Icon";

type EventPreview = {
  id: string;
  title: string;
  location: string | null;
  start_at: string;
};

function formatEventLine(iso: string, location: string | null): string {
  let when = iso;
  try {
    when = new Date(iso).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  } catch {
    /* keep raw */
  }
  const loc = location?.trim() || "TBD";
  return `${when} • ${loc}`;
}

function calendarParts(iso: string): { month: string; day: string } {
  try {
    const d = new Date(iso);
    return {
      month: d.toLocaleString(undefined, { month: "short" }),
      day: String(d.getDate()),
    };
  } catch {
    return { month: "—", day: "—" };
  }
}

const bentoShadow = {
  shadowColor: "#F59E0B",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 20,
  elevation: 2,
};

export default function HomeScreen({ navigation }: any) {
  const { user, profile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [events, setEvents] = useState<EventPreview[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const client = supabase;
    if (!client || !user?.id || !profile?.church_id) {
      setUnreadCount(0);
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const nowIso = new Date().toISOString();
    const [notifRes, eventsRes] = await Promise.all([
      client.from("notification_log").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("read_at", null),
      client
        .from("events")
        .select("id, title, location, start_at")
        .eq("church_id", profile.church_id)
        .eq("is_cancelled", false)
        .gte("start_at", nowIso)
        .order("start_at", { ascending: true })
        .limit(3),
    ]);
    setUnreadCount(notifRes.count ?? 0);
    setEvents((eventsRes.data as EventPreview[]) ?? []);
    setLoading(false);
  }, [user?.id, profile?.church_id]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const padH = STITCH_PAD_H;

  return (
    <AppShell>
      <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ paddingBottom: 120 }}>
        <StitchTabAppBar
          navigation={navigation}
          rightAccessory={
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <TouchableOpacity
                onPress={() => navigation.navigate("Notifications")}
                style={{ position: "relative", padding: 10, borderRadius: 24, backgroundColor: theme.colors.surface2 }}
                accessibilityLabel="Open notifications"
              >
                <Icon name="notifications" size={22} color={theme.colors.textSecondary} />
                {unreadCount > 0 ? (
                  <View
                    style={{
                      position: "absolute",
                      top: 2,
                      right: 2,
                      minWidth: 18,
                      height: 18,
                      paddingHorizontal: unreadCount > 9 ? 5 : 0,
                      backgroundColor: theme.colors.primary,
                      borderRadius: 9,
                      borderWidth: 2,
                      borderColor: theme.colors.card,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: unreadCount > 99 ? 9 : 11, color: "#fff", fontWeight: "700" }}>
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate("ProfileMenu")}
                accessibilityLabel="Open profile menu"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  overflow: "hidden",
                  borderWidth: 2,
                  borderColor: "rgba(255, 219, 184, 0.85)",
                }}
              >
                <Image source={require("../../assets/logo.png")} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
              </TouchableOpacity>
            </View>
          }
        />

        <View style={{ paddingHorizontal: padH, marginTop: 24, marginBottom: 40 }}>
          <View style={stitchEditorialPanel}>
            <View style={{ position: "absolute", top: -48, right: -48, width: 192, height: 192, borderRadius: 96, backgroundColor: theme.colors.primary, opacity: 0.05 }} />
            <View style={{ position: "relative", zIndex: 1 }}>
              <Text
                style={{
                  fontFamily: theme.typography.fontFamily,
                  fontSize: 12,
                  fontWeight: theme.typography.fontWeight.bold as any,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: theme.colors.primary,
                  marginBottom: 24,
                }}
              >
                Message of the Day
              </Text>
              <Text
                style={{
                  fontFamily: theme.typography.fontFamily,
                  fontSize: 32,
                  fontWeight: "300",
                  fontStyle: "italic",
                  lineHeight: 40,
                  color: theme.colors.textSecondary,
                  marginBottom: 24,
                }}
              >
                &ldquo;Let all that you do be done in love.&rdquo;
              </Text>
              <Text
                style={{
                  fontFamily: theme.typography.fontFamily,
                  fontSize: 14,
                  fontWeight: "500",
                  letterSpacing: 2,
                  color: theme.colors.textPrimary,
                  opacity: 0.6,
                  textTransform: "uppercase",
                }}
              >
                1 COR 16:14
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Access — `home/code.html` three-column bento */}
        <View style={{ paddingHorizontal: padH, marginBottom: 40 }}>
          <View style={{ flexDirection: "row", gap: 16 }}>
            <TouchableOpacity
              onPress={() => navigation.navigate("Members")}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 24,
                paddingHorizontal: 12,
                backgroundColor: theme.colors.card,
                borderRadius: theme.radii.lg,
                ...bentoShadow,
              }}
            >
              <View style={{ marginBottom: 12 }}>
                <Icon name="members" size={30} color={theme.colors.primary} />
              </View>
              <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: 14, fontWeight: "600", color: theme.colors.textPrimary }}>Members</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("FeaturePlaceholder", {
                  title: "Groups",
                  subtitle: "Small groups and ministries will appear here when this feature is available.",
                })
              }
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 24,
                paddingHorizontal: 12,
                backgroundColor: theme.colors.card,
                borderRadius: theme.radii.lg,
                ...bentoShadow,
              }}
            >
              <View style={{ marginBottom: 12 }}>
                <Icon name="groups" size={30} color={theme.colors.primary} />
              </View>
              <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: 14, fontWeight: "600", color: theme.colors.textPrimary }}>Groups</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate("Events")}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 24,
                paddingHorizontal: 12,
                backgroundColor: theme.colors.card,
                borderRadius: theme.radii.lg,
                ...bentoShadow,
              }}
            >
              <View style={{ marginBottom: 12 }}>
                <Icon name="calendar" size={30} color={theme.colors.primary} />
              </View>
              <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: 14, fontWeight: "600", color: theme.colors.textPrimary }}>Calendar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Upcoming Events — dossier list rows */}
        <View style={{ paddingHorizontal: padH, marginBottom: 40 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16, paddingHorizontal: 8 }}>
            <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: 22, fontWeight: "700", color: theme.colors.textPrimary, letterSpacing: -0.3 }}>Upcoming Events</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Events")}>
              <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: 14, fontWeight: "700", color: theme.colors.primary }}>See All</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginVertical: 16 }} />
          ) : events.length === 0 ? (
            <Text style={{ fontFamily: theme.typography.fontFamily, color: theme.colors.muted, marginBottom: 8 }}>No upcoming events scheduled.</Text>
          ) : (
            <View style={{ gap: 16 }}>
              {events.map((event) => {
                const { month, day } = calendarParts(event.start_at);
                return (
                  <TouchableOpacity
                    key={event.id}
                    onPress={() => navigation.navigate("EventDetail", { eventId: event.id })}
                    activeOpacity={0.9}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: theme.colors.card,
                      borderRadius: theme.radii.lg,
                      padding: 20,
                      ...stitchRowShadowSoft,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 14,
                          backgroundColor: stitchPrimaryFixedBg,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: 16, fontWeight: "700", color: theme.colors.primary }}>{day}</Text>
                      </View>
                      <View>
                        <Text style={{ fontFamily: theme.typography.fontFamily, fontWeight: "700", fontSize: 16, color: theme.colors.textPrimary }}>{event.title}</Text>
                        <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: 14, color: theme.colors.textSecondary, marginTop: 2 }}>{formatEventLine(event.start_at, event.location)}</Text>
                      </View>
                    </View>
                    <Icon name="chevronRight" size={22} color={theme.colors.textMuted} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Attendance — `surface-container` panel from dossier */}
        <View style={{ paddingHorizontal: padH, marginBottom: 32 }}>
          <View style={{ backgroundColor: "#EFEEEA", borderRadius: theme.radii.lg, padding: 32 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
              <View>
                <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: 20, fontWeight: "700", color: theme.colors.textPrimary, letterSpacing: -0.3 }}>Attendance</Text>
                <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: 14, color: theme.colors.textSecondary, marginTop: 4 }}>Trends this month</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, backgroundColor: "rgba(245, 158, 11, 0.1)" }}>
                <Icon name="trendingUp" size={14} color={theme.colors.primary} />
                <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: 14, fontWeight: "700", color: theme.colors.primary }}>+12%</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 128, paddingHorizontal: 8, gap: 8 }}>
              {[0.4, 0.65, 0.55, 0.85, 0.7, 0.95].map((h, i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    height: Math.round(120 * h),
                    borderTopLeftRadius: 12,
                    borderTopRightRadius: 12,
                    backgroundColor: i === 5 ? theme.colors.primary : stitchPrimaryFixedBg,
                  }}
                />
              ))}
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 16, paddingHorizontal: 8 }}>
              {["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5", "Now"].map((label) => (
                <Text key={label} style={{ fontFamily: theme.typography.fontFamily, fontSize: 10, fontWeight: "700", color: theme.colors.textSecondary, letterSpacing: 2, textTransform: "uppercase" }}>
                  {label}
                </Text>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </AppShell>
  );
}
