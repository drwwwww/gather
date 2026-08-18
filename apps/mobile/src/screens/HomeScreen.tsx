import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Animated, Easing } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Icon } from "../components/ui/Icon";
import {
  Screen, Avatar, GlassIconButton, PressCard, SectionHeader, IconChip, Loader, LinearGradient,
  Pulse, Reveal,
  palette, font, gradient, radius, shadow, space, type,
} from "../components/ds";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";

type EventPreview = { id: string; title: string; location: string | null; start_at: string };
type AnnouncementPreview = { id: string; title: string; body: string | null; publish_at: string | null; image_url: string | null };

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
function firstName(fullName: string | null | undefined): string {
  return fullName?.trim().split(" ")[0] || "there";
}
function formatCountdown(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return "Now";
  const hours = diff / 3600000;
  if (hours < 1) return "Soon";
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = Math.ceil(hours / 24);
  if (days === 1) return "Tomorrow";
  return `${days}d`;
}
/** Only pulse the countdown when it's actually imminent — pulsing "12d" would cry wolf. */
function isCountdownImminent(iso: string): boolean {
  const hours = (new Date(iso).getTime() - Date.now()) / 3600000;
  return hours < 24;
}
function formatEventLine(iso: string, location: string | null): string {
  try {
    const d = new Date(iso);
    const when = d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    return `${when} · ${location?.trim() || "TBD"}`;
  } catch { return iso; }
}
function calendarParts(iso: string): { month: string; day: string } {
  try {
    const d = new Date(iso);
    return { month: d.toLocaleString(undefined, { month: "short" }), day: String(d.getDate()) };
  } catch { return { month: "—", day: "—" }; }
}

/** A friendly one-time wave on the greeting emoji — settles after a couple swings, doesn't loop forever. */
function WavingHand() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const t = setTimeout(() => {
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 180, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(anim, { toValue: -1, duration: 180, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 180, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 180, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]).start();
    }, 350);
    return () => clearTimeout(t);
  }, [anim]);
  const rotate = anim.interpolate({ inputRange: [-1, 1], outputRange: ["-18deg", "18deg"] });
  return (
    <Animated.Text style={{ transform: [{ rotate }] }}>👋</Animated.Text>
  );
}

type QuickAction = { icon: any; label: string; sub: string; route: string };
const BASE_ACTIONS: QuickAction[] = [
  { icon: "members", label: "Members", sub: "Directory", route: "Members" },
  { icon: "events", label: "Events", sub: "Calendar", route: "Events" },
  { icon: "announcements", label: "News", sub: "Updates", route: "Announcements" },
];

export default function HomeScreen({ navigation }: any) {
  const { user, profile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [events, setEvents] = useState<EventPreview[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementPreview[]>([]);
  const [churchName, setChurchName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const client = supabase;
    if (!client || !user?.id || !profile?.church_id) {
      setUnreadCount(0); setEvents([]); setAnnouncements([]); setLoading(false);
      return;
    }
    setLoading(true);
    const nowIso = new Date().toISOString();
    const churchId = profile.church_id as string;
    const [notifRes, eventsRes, announcementsRes, churchRes] = await Promise.all([
      client.from("notification_log").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("read_at", null),
      client.from("events").select("id, title, location, start_at").eq("church_id", churchId).eq("is_cancelled", false).gte("start_at", nowIso).order("start_at", { ascending: true }).limit(3),
      client.from("announcements").select("id, title, body, publish_at, image_url").eq("church_id", churchId).lte("publish_at", nowIso).order("publish_at", { ascending: false }).limit(2),
      client.from("churches").select("name").eq("id", churchId).maybeSingle(),
    ]);
    setUnreadCount(notifRes.count ?? 0);
    setEvents((eventsRes.data as EventPreview[]) ?? []);
    setAnnouncements((announcementsRes.data as AnnouncementPreview[]) ?? []);
    setChurchName((churchRes.data as { name: string } | null)?.name ?? null);
    setLoading(false);
  }, [user?.id, profile?.church_id]);

  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const nextEvent = events[0] ?? null;
  const name = firstName(profile?.full_name ?? user?.user_metadata?.full_name);
  const isServe = profile?.role === "SERVICE" || profile?.role === "ADMIN";
  const quickActions: QuickAction[] = [
    ...BASE_ACTIONS,
    isServe
      ? { icon: "serve", label: "Serve", sub: "Schedule", route: "Serve" }
      : { icon: "church", label: "Church", sub: "Info", route: "ChurchInfo" },
  ];

  return (
    <Screen>
      {/* Top row */}
      <View style={styles.topRow}>
        <Pressable onPress={() => navigation.navigate("ProfileMenu")} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Avatar name={profile?.full_name ?? user?.user_metadata?.full_name} tone="amber" size={44} />
          <View>
            <Text style={styles.eyebrow}>{getGreeting()}</Text>
            <Text style={styles.churchName} numberOfLines={1}>{churchName ?? "Your church"}</Text>
          </View>
        </Pressable>
        <GlassIconButton icon="notifications" badge={unreadCount} onPress={() => navigation.navigate("Notifications")} accessibilityLabel="Notifications" />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        {/* Greeting */}
        <View style={styles.greetWrap}>
          <Text style={styles.greeting}>Hi, {name} <WavingHand /></Text>
          <Text style={styles.greetSub}>Here's what's happening in your community.</Text>
        </View>

        {/* Next event card */}
        {!loading && nextEvent ? (
          <PressCard onPress={() => navigation.navigate("EventDetail", { eventId: nextEvent.id })} style={styles.nextCard}>
            <LinearGradient colors={gradient.amber} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.nextIcon}>
              <Icon name="calendar" size={20} color={palette.onDark} />
            </LinearGradient>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.nextLabel}>NEXT UP</Text>
              <Text style={styles.nextTitle} numberOfLines={1}>{nextEvent.title}</Text>
              <Text style={styles.nextMeta} numberOfLines={1}>{formatEventLine(nextEvent.start_at, nextEvent.location)}</Text>
            </View>
            <Pulse active={isCountdownImminent(nextEvent.start_at)} minOpacity={0.65} maxScale={1.06} duration={1000}>
              <View style={styles.countdown}>
                <Text style={styles.countdownTxt}>{formatCountdown(nextEvent.start_at)}</Text>
              </View>
            </Pulse>
          </PressCard>
        ) : null}

        {/* Quick actions — bare icon + label, evenly spaced, no card chrome */}
        <View style={styles.quickGrid}>
          {quickActions.map((a, i) => (
            <Reveal key={a.route} index={i}>
              <Pressable
                onPress={() => navigation.navigate(a.route)}
                style={({ pressed }) => [styles.quickTile, pressed && { opacity: 0.6, transform: [{ scale: 0.94 }] }]}
              >
                <IconChip name={a.icon} size={54} iconSize={24} tone="white" />
                <Text style={styles.quickLabel}>{a.label}</Text>
              </Pressable>
            </Reveal>
          ))}
        </View>

        {/* Upcoming events */}
        <View style={styles.section}>
          <SectionHeader title="Upcoming Events" actionLabel="See all" onAction={() => navigation.navigate("Events")} />
          {loading ? (
            <Loader style={{ marginTop: 8, marginBottom: 8 }} />
          ) : events.length === 0 ? (
            <View style={styles.plainCard}><Text style={styles.mutedCenter}>No upcoming events scheduled.</Text></View>
          ) : (
            <View style={{ gap: 10 }}>
              {events.map((event, i) => {
                const { month, day } = calendarParts(event.start_at);
                return (
                  <Reveal key={event.id} index={i}>
                    <PressCard onPress={() => navigation.navigate("EventDetail", { eventId: event.id })} style={styles.eventRow}>
                      <View style={styles.dateBadge}>
                        <Text style={styles.dateDay}>{day}</Text>
                        <Text style={styles.dateMonth}>{month}</Text>
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                        <Text style={styles.eventDetail} numberOfLines={1}>{formatEventLine(event.start_at, event.location)}</Text>
                      </View>
                      <Icon name="chevronRight" size={18} color={palette.inkMuted} />
                    </PressCard>
                  </Reveal>
                );
              })}
            </View>
          )}
        </View>

        {/* Latest news */}
        {announcements.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Latest News" actionLabel="See all" onAction={() => navigation.navigate("Announcements")} />
            <View style={{ gap: 10 }}>
              {announcements.map((a, i) => (
                <Reveal key={a.id} index={i}>
                  <PressCard
                    onPress={() => navigation.navigate("AnnouncementsDetail", { announcement: { id: a.id, title: a.title, body: a.body, publish_at: a.publish_at, image_url: a.image_url } })}
                    style={styles.newsCard}
                  >
                    <View style={styles.newsAccent} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.newsTitle} numberOfLines={2}>{a.title}</Text>
                      {a.body ? <Text style={styles.newsBody} numberOfLines={2}>{a.body}</Text> : null}
                    </View>
                  </PressCard>
                </Reveal>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    height: 60,
    paddingHorizontal: space.gutter,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eyebrow: { fontFamily: font.medium, fontSize: 12, color: palette.inkMuted },
  churchName: { fontFamily: font.bold, fontSize: 15, color: palette.ink, marginTop: 1 },

  greetWrap: { paddingHorizontal: space.gutter, paddingTop: 8, paddingBottom: 20 },
  greeting: { ...type.greeting, color: palette.ink },
  greetSub: { fontFamily: font.regular, fontSize: 14, color: palette.inkSoft, marginTop: 4 },

  nextCard: {
    marginHorizontal: space.gutter,
    marginBottom: 22,
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    ...shadow.md,
  },
  nextIcon: { width: 46, height: 46, borderRadius: radius.md, alignItems: "center", justifyContent: "center", ...shadow.amber },
  nextLabel: { fontFamily: font.bold, fontSize: 10, color: palette.amberDeep, letterSpacing: 1.2 },
  nextTitle: { fontFamily: font.bold, fontSize: 16, color: palette.ink, marginTop: 3 },
  nextMeta: { fontFamily: font.regular, fontSize: 12, color: palette.inkMuted, marginTop: 2 },
  countdown: { backgroundColor: palette.amberSofter, borderRadius: radius.chip, paddingHorizontal: 11, paddingVertical: 6 },
  countdownTxt: { fontFamily: font.bold, fontSize: 12, color: palette.amberDeep },

  quickGrid: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: space.gutter, marginBottom: 28 },
  quickTile: { alignItems: "center", gap: 8, width: 74 },
  quickLabel: { fontFamily: font.bold, fontSize: 12.5, color: palette.ink, textAlign: "center" },

  section: { paddingHorizontal: space.gutter, marginBottom: 28 },
  plainCard: { backgroundColor: palette.surface, borderRadius: radius.xl, padding: 20, ...shadow.sm },
  mutedCenter: { fontFamily: font.regular, fontSize: 14, color: palette.inkMuted, textAlign: "center" },

  eventRow: { backgroundColor: palette.surface, borderRadius: radius.lg, padding: 14, flexDirection: "row", alignItems: "center", gap: 14, ...shadow.sm },
  dateBadge: { width: 50, height: 50, borderRadius: radius.md, backgroundColor: palette.amberSofter, alignItems: "center", justifyContent: "center" },
  dateDay: { fontFamily: font.bold, fontSize: 19, color: palette.amberDeep, lineHeight: 21 },
  dateMonth: { fontFamily: font.bold, fontSize: 9, color: palette.inkMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  eventTitle: { fontFamily: font.bold, fontSize: 15, color: palette.ink },
  eventDetail: { fontFamily: font.regular, fontSize: 12, color: palette.inkSoft, marginTop: 2 },

  newsCard: { backgroundColor: palette.surface, borderRadius: radius.lg, padding: 16, flexDirection: "row", gap: 14, ...shadow.sm },
  newsAccent: { width: 4, borderRadius: 2, backgroundColor: palette.amber, alignSelf: "stretch" },
  newsTitle: { fontFamily: font.bold, fontSize: 15, color: palette.ink, marginBottom: 4 },
  newsBody: { fontFamily: font.regular, fontSize: 13, color: palette.inkSoft, lineHeight: 18 },
});
