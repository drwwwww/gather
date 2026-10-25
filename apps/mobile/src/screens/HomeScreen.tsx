import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  Animated,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Icon } from "../components/ui/Icon";
import {
  Screen,
  Avatar,
  LinearGradient,
  palette,
  font,
  radius,
  shadow,
  space,
} from "../components/ds";
import { RiseIn, Shimmer, usePressScale } from "../components/ds/motion";
import {
  WORSHIP_HANDS,
  CONGREGATION_SERVICE,
  WELCOME_EMBRACE,
  SANCTUARY_PEWS,
} from "../lib/churchImagery";
import BrandArt from "../components/app/BrandArt";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";
import { AREA, eventHue } from "../theme/areas";

/* ────────────────────────────────────────────── types + helpers */

type EventPreview = { id: string; title: string; location: string | null; start_at: string; image_url: string | null };
type AnnouncementPreview = {
  id: string;
  title: string;
  body: string | null;
  publish_at: string | null;
  image_url: string | null;
};
type AssignmentPreview = {
  key: string;
  source: "plan_item" | "plan_role_slot";
  id: string;
  title: string;
  when: string;
  status: string;
};

function greetingFor(h: number): string {
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
function firstName(fullName: string | null | undefined): string {
  return fullName?.trim().split(" ")[0] || "there";
}
function countdown(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return "Now";
  const hours = diff / 3600000;
  if (hours < 1) return "Soon";
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = Math.ceil(hours / 24);
  return days === 1 ? "Tomorrow" : `${days}d`;
}
function eventLine(iso: string, location: string | null): string {
  try {
    const d = new Date(iso);
    const when = d.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    return `${when} · ${location?.trim() || "TBD"}`;
  } catch {
    return iso;
  }
}
function dateParts(iso: string): { month: string; day: string } {
  try {
    const d = new Date(iso);
    return { month: d.toLocaleString(undefined, { month: "short" }).toUpperCase(), day: String(d.getDate()) };
  } catch {
    return { month: "—", day: "—" };
  }
}
function serviceWhen(dateStr: string, startTime: string | null, serviceName?: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  const day = d.toLocaleString(undefined, { weekday: "short" });
  const [h, m] = (startTime || "09:00").split(":").map(Number);
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  const time = `${day} ${hour}:${String(m ?? 0).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
  return serviceName ? `${serviceName} · ${time}` : time;
}

/* Browse tiles — a colour per category with a photograph layered over it,
   the way Fiverr/OpenSea vary their category cards. Colours are muted and
   deliberately not amber: amber stays reserved for CTAs and active states.
   Local assets so they render instantly and work offline. */
const BROWSE = [
  {
    key: "Events",
    label: "Events",
    sub: "What's coming up",
    tint: ["#3B4E78", "#22304F"] as const, // navy
    img: WORSHIP_HANDS,
  },
  {
    key: "Announcements",
    label: "News",
    sub: "From your church",
    tint: ["#5F6A45", "#3D472A"] as const, // olive
    img: CONGREGATION_SERVICE,
  },
  {
    key: "Members",
    label: "Directory",
    sub: "Find your people",
    tint: ["#6A4463", "#452B43"] as const, // plum
    img: WELCOME_EMBRACE,
  },
  {
    key: "ChurchInfo",
    label: "Our church",
    sub: "Times & place",
    tint: ["#3A6163", "#234142"] as const, // teal
    img: SANCTUARY_PEWS,
  },
] as const;

/* ────────────────────────────────────────────── screen */

export default function HomeScreen({ navigation }: any) {
  const { user, profile } = useAuth();
  const { width } = useWindowDimensions();

  const [unreadCount, setUnreadCount] = useState(0);
  const [events, setEvents] = useState<EventPreview[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementPreview[]>([]);
  const [assignments, setAssignments] = useState<AssignmentPreview[]>([]);
  const [churchName, setChurchName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isServe = profile?.role === "SERVICE" || profile?.role === "ADMIN";

  const refresh = useCallback(async () => {
    const client = supabase;
    if (!client || !user?.id || !profile?.church_id) {
      setUnreadCount(0);
      setEvents([]);
      setAnnouncements([]);
      setAssignments([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    const nowIso = new Date().toISOString();
    const churchId = profile.church_id as string;

    const [notifRes, eventsRes, announcementsRes, churchRes] = await Promise.all([
      client
        .from("notification_log")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("read_at", null),
      client
        .from("events")
        .select("id, title, location, start_at, image_url")
        .eq("church_id", churchId)
        .eq("is_cancelled", false)
        .gte("start_at", nowIso)
        .order("start_at", { ascending: true })
        .limit(6),
      client
        .from("announcements")
        .select("id, title, body, publish_at, image_url")
        .eq("church_id", churchId)
        .lte("publish_at", nowIso)
        .order("publish_at", { ascending: false })
        .limit(5),
      client.from("churches").select("name").eq("id", churchId).maybeSingle(),
    ]);

    // A failed request (flaky network, token refresh) keeps what's on screen
    // rather than blanking Home into "nothing on the calendar".
    if (!notifRes.error) setUnreadCount(notifRes.count ?? 0);
    if (!eventsRes.error) setEvents((eventsRes.data as EventPreview[]) ?? []);
    if (!announcementsRes.error) setAnnouncements((announcementsRes.data as AnnouncementPreview[]) ?? []);
    if (!churchRes.error && churchRes.data) setChurchName((churchRes.data as { name: string }).name);

    // Serving assignments awaiting a reply — the action-first block, in the
    // spirit of Fiverr's "My custom offers".
    if (isServe) {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
        today.getDate()
      ).padStart(2, "0")}`;
      const { data: plansData, error: plansError } = await client
        .from("service_plans")
        .select("id, service_date, start_time, service_time_id")
        .eq("church_id", churchId)
        .gte("service_date", todayStr)
        .order("service_date", { ascending: true })
        .limit(20);
      if (plansError) { setLoading(false); setRefreshing(false); return; }
      const plans = (plansData ?? []) as { id: string; service_date: string; start_time: string | null; service_time_id: string | null }[];
      const planById = new Map(plans.map((p) => [p.id, p]));
      const planIds = plans.map((p) => p.id);

      const serviceTimeIds = [...new Set(plans.map((p) => p.service_time_id).filter((id): id is string => !!id))];
      const serviceTimesRes = serviceTimeIds.length
        ? await client.from("service_times").select("id, name").in("id", serviceTimeIds)
        : { data: [] as { id: string; name: string }[] };
      const serviceNameById = new Map((serviceTimesRes.data ?? []).map((s) => [s.id, s.name]));

      const pending: AssignmentPreview[] = [];
      if (planIds.length) {
        const [slotsRes, itemsRes] = await Promise.all([
          client
            .from("service_plan_role_slots")
            .select("id, role_id, plan_id, status, assigned_user_id")
            .in("plan_id", planIds)
            .eq("assigned_user_id", user.id)
            .eq("status", "ASSIGNED"),
          client
            .from("service_plan_items")
            .select("id, title, plan_id, assignment_status, assigned_user_id")
            .in("plan_id", planIds)
            .eq("assigned_user_id", user.id)
            .eq("assignment_status", "ASSIGNED"),
        ]);

        const slots = (slotsRes.data ?? []) as any[];
        const roleIds = [...new Set(slots.map((s) => s.role_id))];
        const rolesRes = roleIds.length
          ? await client.from("volunteer_roles").select("id, name").in("id", roleIds)
          : { data: [] as { id: string; name: string }[] };
        const roleNames = new Map((rolesRes.data ?? []).map((r: any) => [r.id, r.name]));

        for (const s of slots) {
          const plan = planById.get(s.plan_id);
          if (!plan) continue;
          pending.push({
            key: `r-${s.id}`,
            source: "plan_role_slot",
            id: s.id,
            title: roleNames.get(s.role_id) ?? "Role",
            when: serviceWhen(plan.service_date, plan.start_time, plan.service_time_id ? serviceNameById.get(plan.service_time_id) : undefined),
            status: s.status,
          });
        }
        for (const it of (itemsRes.data ?? []) as any[]) {
          const plan = planById.get(it.plan_id);
          if (!plan) continue;
          pending.push({
            key: `i-${it.id}`,
            source: "plan_item",
            id: it.id,
            title: it.title?.trim() || "Service part",
            when: serviceWhen(plan.service_date, plan.start_time, plan.service_time_id ? serviceNameById.get(plan.service_time_id) : undefined),
            status: it.assignment_status,
          });
        }
      }
      setAssignments(pending.slice(0, 6));
    } else {
      setAssignments([]);
    }

    setLoading(false);
    setRefreshing(false);
  }, [user?.id, profile?.church_id, isServe]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void refresh();
  }, [refresh]);

  const nextEvent = events[0] ?? null;
  const name = firstName(profile?.full_name ?? user?.user_metadata?.full_name);
  const hour = new Date().getHours();
  const tileW = useMemo(() => Math.min(168, (width - space.gutter * 2 - 12) / 2.25), [width]);

  return (
    <Screen glow>
      {/* ── Header: identity left, actions grouped right (Monzo) ── */}
      <View style={styles.topRow}>
        <Pressable onPress={() => navigation.navigate("ProfileMenu")} style={styles.identity}>
          <Avatar imageUri={profile?.avatar_url} name={profile?.full_name ?? user?.user_metadata?.full_name} tone="amber" size={40} />
          {/* flex: 1 lets the name take only the room left beside the action pill;
              without it a long name ran underneath the search button. */}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.eyebrow}>{greetingFor(hour)}</Text>
            <Text style={styles.churchName} numberOfLines={2}>
              {churchName ?? "Your church"}
            </Text>
          </View>
        </Pressable>

        <View style={styles.actionPill}>
          <Pressable
            onPress={() => navigation.navigate("Search")}
            style={styles.actionBtn}
            accessibilityLabel="Search"
          >
            <Icon name="search" size={19} color={palette.ink} />
          </Pressable>
          <View style={styles.actionDivider} />
          <Pressable
            onPress={() => navigation.navigate("Notifications")}
            style={styles.actionBtn}
            accessibilityLabel="Notifications"
          >
            <Icon name="notifications" size={19} color={palette.ink} />
            {unreadCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeTxt}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: space.xxl }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.amber} />
        }
      >
        {/* ── Greeting ── */}
        <View style={styles.greetWrap}>
          <Text style={styles.greeting}>Hi, {name}</Text>
          <Text style={styles.greetSub}>Here&apos;s what&apos;s happening this week.</Text>
        </View>

        {/* ── Next up hero (Monzo "Pots" card) ── */}
        {loading ? (
          <View style={styles.groupCard}>
            <Shimmer style={{ height: 14, width: 90, marginBottom: 14 }} />
            <Shimmer style={{ height: 96, borderRadius: radius.lg }} />
          </View>
        ) : nextEvent ? (
          <RiseIn>
            <View style={styles.groupCard}>
              <View style={styles.groupHead}>
                <Text style={styles.groupTitle}>Next up</Text>
                <Pressable onPress={() => navigation.navigate("Events")} hitSlop={8}>
                  <Text style={styles.groupAction}>See all</Text>
                </Pressable>
              </View>

              <NextUpCard event={nextEvent} onPress={() => navigation.navigate("EventDetail", { eventId: nextEvent.id })} />
            </View>
          </RiseIn>
        ) : null}

        {/* ── Awaiting your reply (Fiverr "custom offers") ── */}
        {assignments.length > 0 ? (
          <RiseIn index={1}>
            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.sectionTitle}>Awaiting your reply</Text>
                  <View style={styles.countDot}>
                    <Text style={styles.countDotTxt}>{assignments.length}</Text>
                  </View>
                </View>
                <Pressable onPress={() => navigation.navigate("Serve")} hitSlop={8}>
                  <Text style={styles.groupAction}>See all</Text>
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hScroll}
                decelerationRate="fast"
                snapToInterval={286}
              >
                {assignments.map((a) => (
                  <OfferCard key={a.key} assignment={a} onOpen={() => navigation.navigate("Serve")} />
                ))}
              </ScrollView>
            </View>
          </RiseIn>
        ) : null}

        {/* ── Browse tiles (OpenSea categories) ── */}
        <RiseIn index={2}>
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Browse</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hScroll}
              decelerationRate="fast"
            >
              {BROWSE.map((b) => (
                <BrowseTile
                  key={b.key}
                  width={tileW}
                  label={b.label}
                  sub={b.sub}
                  tint={b.tint}
                  img={b.img}
                  onPress={() => navigation.navigate(b.key)}
                />
              ))}
            </ScrollView>
          </View>
        </RiseIn>

        {/* ── Upcoming (Monzo grouped list) ── */}
        <RiseIn index={3}>
          <View style={styles.groupCard}>
            <View style={styles.groupHead}>
              <Text style={styles.groupTitle}>Upcoming</Text>
              <Pressable onPress={() => navigation.navigate("Events")} hitSlop={8}>
                <Text style={styles.groupAction}>See all</Text>
              </Pressable>
            </View>

            {loading ? (
              <View style={{ gap: 14, paddingTop: 4 }}>
                <Shimmer style={{ height: 46, borderRadius: radius.md }} />
                <Shimmer style={{ height: 46, borderRadius: radius.md }} />
              </View>
            ) : events.length <= 1 ? (
              <Text style={styles.emptyTxt}>Nothing else on the calendar yet.</Text>
            ) : (
              events.slice(1, 5).map((e, i, arr) => (
                <ListRow
                  key={e.id}
                  event={e}
                  index={i}
                  last={i === arr.length - 1}
                  onPress={() => navigation.navigate("EventDetail", { eventId: e.id })}
                />
              ))
            )}
          </View>
        </RiseIn>

        {/* ── Latest news (OpenSea "notable drops") ── */}
        {announcements.length > 0 ? (
          <RiseIn index={4}>
            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>Latest news</Text>
                <Pressable onPress={() => navigation.navigate("Announcements")} hitSlop={8}>
                  <Text style={styles.groupAction}>See all</Text>
                </Pressable>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hScroll}
                decelerationRate="fast"
              >
                {announcements.map((a) => (
                  <NewsCard
                    key={a.id}
                    item={a}
                    onPress={() =>
                      navigation.navigate("AnnouncementsDetail", {
                        announcement: {
                          id: a.id,
                          title: a.title,
                          body: a.body,
                          publish_at: a.publish_at,
                          image_url: a.image_url,
                        },
                      })
                    }
                  />
                ))}
              </ScrollView>
            </View>
          </RiseIn>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

/* ────────────────────────────────────────────── pieces */

function NextUpCard({ event, onPress }: { event: EventPreview; onPress: () => void }) {
  const press = usePressScale(0.975);
  const { month, day } = dateParts(event.start_at);

  return (
    <Animated.View style={press.style}>
      <Pressable onPress={onPress} onPressIn={press.onPressIn} onPressOut={press.onPressOut}>
        <View style={styles.heroCard}>
          {event.image_url ? (
            <Image source={{ uri: event.image_url }} style={[StyleSheet.absoluteFill as any, styles.fillImg]} resizeMode="cover" />
          ) : (
            <BrandArt seed={event.id} style={StyleSheet.absoluteFill} />
          )}
          <LinearGradient
            colors={["rgba(28,14,2,0.15)", "rgba(28,14,2,0.82)"]}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.heroTop}>
            <View style={styles.heroDate}>
              <Text style={styles.heroDateDay}>{day}</Text>
              <Text style={styles.heroDateMonth}>{month}</Text>
            </View>
            <View style={styles.heroCountdown}>
              <Icon name="clock" size={12} color={palette.amberDeep} />
              <Text style={styles.heroCountdownTxt}>{countdown(event.start_at)}</Text>
            </View>
          </View>

          <View style={styles.heroBottom}>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {event.title}
            </Text>
            <Text style={styles.heroMeta} numberOfLines={1}>
              {eventLine(event.start_at, event.location)}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function OfferCard({ assignment, onOpen }: { assignment: AssignmentPreview; onOpen: () => void }) {
  const press = usePressScale(0.97);
  return (
    <Animated.View style={press.style}>
      <Pressable onPress={onOpen} onPressIn={press.onPressIn} onPressOut={press.onPressOut} style={styles.offerCard}>
        <View style={styles.offerHead}>
          <View style={[styles.offerIcon, { backgroundColor: AREA.services.tint }]}>
            <Icon name="serve" size={16} color={AREA.services.ink} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.offerTitle} numberOfLines={2}>
              {assignment.title}
            </Text>
            <Text style={styles.offerWhen} numberOfLines={1}>
              {assignment.when}
            </Text>
          </View>
        </View>
        <View style={styles.offerDivider} />
        <View style={styles.offerCta}>
          <Text style={styles.offerCtaTxt}>Respond</Text>
          <Icon name="arrowRight" size={15} color={palette.onDark} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

function BrowseTile({
  width,
  label,
  sub,
  tint,
  img,
  onPress,
}: {
  width: number;
  label: string;
  sub: string;
  /** Category colour that reads through the photograph. */
  tint: readonly [string, string];
  img: any;
  onPress: () => void;
}) {
  const press = usePressScale(0.955);
  return (
    <Animated.View style={press.style}>
      <Pressable
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        style={[styles.browseTile, { width }]}
      >
        <LinearGradient
          colors={tint as unknown as string[]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Image
          source={img}
          style={[StyleSheet.absoluteFill as any, styles.browseImg]}
          resizeMode="cover"
        />
        <View style={styles.browseTxt}>
          <Text style={styles.browseLabel} numberOfLines={1}>
            {label}
          </Text>
          <Text style={styles.browseSub} numberOfLines={1}>
            {sub}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function ListRow({ event, index, last, onPress }: { event: EventPreview; index: number; last: boolean; onPress: () => void }) {
  const { month, day } = dateParts(event.start_at);
  const hue = eventHue(index);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [styles.listRow, !last && styles.listRowBorder, pressed && { opacity: 0.6 }]}
    >
      <View style={[styles.listDate, { backgroundColor: hue.tint }]}>
        <Text style={[styles.listDay, { color: hue.ink }]}>{day}</Text>
        <Text style={[styles.listMonth, { color: hue.ink, opacity: 0.75 }]}>{month}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.listTitle} numberOfLines={2}>
          {event.title}
        </Text>
        <Text style={styles.listMeta} numberOfLines={1}>
          {eventLine(event.start_at, event.location)}
        </Text>
      </View>
      <Icon name="chevronRight" size={17} color={palette.inkMuted} />
    </Pressable>
  );
}

/** Same photo-forward language as EventCard, at carousel scale. */
function NewsCard({ item, onPress }: { item: AnnouncementPreview; onPress: () => void }) {
  const press = usePressScale(0.965);
  return (
    <Animated.View style={press.style}>
      <Pressable onPress={onPress} onPressIn={press.onPressIn} onPressOut={press.onPressOut} style={styles.newsCard}>
        <View style={styles.newsMedia}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={[StyleSheet.absoluteFill as any, styles.fillImg]} resizeMode="cover" />
          ) : (
            <BrandArt seed={item.id} style={StyleSheet.absoluteFill} />
          )}
          <LinearGradient
            colors={["rgba(24,12,2,0.02)", "rgba(24,12,2,0.68)"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.newsBadge}>
            <Icon name="announcements" size={10} color={palette.ink} />
            <Text style={styles.newsBadgeTxt}>News</Text>
          </View>
        </View>
        <Text style={styles.newsTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.body ? (
          <Text style={styles.newsBody} numberOfLines={2}>
            {item.body}
          </Text>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

/* ────────────────────────────────────────────── styles */

const styles = StyleSheet.create({
  topRow: {
    height: 60,
    paddingHorizontal: space.gutter,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  identity: { flexDirection: "row", alignItems: "center", gap: 11, flex: 1, minWidth: 0 },
  eyebrow: { fontFamily: font.medium, fontSize: 11.5, color: palette.inkMuted },
  churchName: { fontFamily: font.bold, fontSize: 15, lineHeight: 19, color: palette.ink, marginTop: 1 },

  actionPill: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.glassStrong,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.glassBorder,
    paddingHorizontal: 4,
    ...shadow.sm,
  },
  actionBtn: { width: 40, height: 38, alignItems: "center", justifyContent: "center" },
  actionDivider: { width: 1, height: 20, backgroundColor: palette.line },
  badge: {
    position: "absolute",
    top: 5,
    right: 5,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: palette.danger,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: palette.surface,
  },
  badgeTxt: { fontFamily: font.bold, fontSize: 9, color: palette.onDark },

  greetWrap: { paddingHorizontal: space.gutter, paddingTop: 6, paddingBottom: 18 },
  greeting: { fontFamily: font.bold, fontSize: 29, lineHeight: 35, letterSpacing: -0.6, color: palette.ink },
  greetSub: { fontFamily: font.regular, fontSize: 14, color: palette.inkSoft, marginTop: 4 },

  /* Grouped card (Monzo) */
  groupCard: {
    marginHorizontal: space.gutter,
    marginBottom: 18,
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
    padding: 16,
    ...shadow.md,
  },
  groupHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 13 },
  groupTitle: { fontFamily: font.bold, fontSize: 16.5, color: palette.ink, letterSpacing: -0.2 },
  groupAction: { fontFamily: font.semibold, fontSize: 13, color: palette.amberDeep },
  emptyTxt: { fontFamily: font.regular, fontSize: 13.5, color: palette.inkMuted, paddingVertical: 8 },

  /* Section (edge-to-edge carousels) */
  section: { marginBottom: 24 },
  sectionHead: {
    paddingHorizontal: space.gutter,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontFamily: font.bold, fontSize: 16.5, color: palette.ink, letterSpacing: -0.2 },
  countDot: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: palette.amber,
    alignItems: "center",
    justifyContent: "center",
  },
  countDotTxt: { fontFamily: font.bold, fontSize: 11, color: palette.onDark },
  hScroll: { paddingHorizontal: space.gutter, gap: 12 },

  /* Hero */
  heroCard: { height: 178, borderRadius: radius.lg, overflow: "hidden", justifyContent: "space-between" },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", padding: 13 },
  heroDate: {
    width: 46,
    height: 50,
    borderRadius: radius.chip,
    backgroundColor: palette.glassStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  heroDateDay: { fontFamily: font.bold, fontSize: 19, lineHeight: 21, color: palette.ink },
  heroDateMonth: { fontFamily: font.bold, fontSize: 8.5, letterSpacing: 0.6, color: palette.inkMuted },
  heroCountdown: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: palette.amberSofter,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  heroCountdownTxt: { fontFamily: font.bold, fontSize: 11.5, color: palette.amberDeep },
  heroBottom: { padding: 15 },
  heroTitle: { fontFamily: font.bold, fontSize: 19, lineHeight: 24, color: palette.onDark, letterSpacing: -0.3 },
  heroMeta: { fontFamily: font.regular, fontSize: 12.5, color: palette.onDarkSoft, marginTop: 4 },

  /* Offer card */
  offerCard: {
    width: 274,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: 14,
    ...shadow.sm,
  },
  offerHead: { flexDirection: "row", alignItems: "center", gap: 11 },
  offerIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.chip,
    backgroundColor: palette.amberSofter,
    alignItems: "center",
    justifyContent: "center",
  },
  offerTitle: { fontFamily: font.bold, fontSize: 14.5, color: palette.ink },
  offerWhen: { fontFamily: font.regular, fontSize: 12, color: palette.inkMuted, marginTop: 2 },
  offerDivider: { height: 1, backgroundColor: palette.lineSoft, marginVertical: 13 },
  offerCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: palette.ink,
    borderRadius: radius.chip,
    paddingVertical: 11,
  },
  offerCtaTxt: { fontFamily: font.bold, fontSize: 13.5, color: palette.onDark },

  /* Browse tile — amber base, photo layered over it at partial opacity */
  browseTile: { height: 118, borderRadius: radius.lg, overflow: "hidden", justifyContent: "flex-end", ...shadow.sm },
  // Explicit width/height are required alongside StyleSheet.absoluteFill —
  // without them, a locally require()'d image's own intrinsic pixel
  // dimensions win over the absolute-fill positioning on react-native-web
  // (confirmed via `expo start --web`), rendering at native resolution and
  // getting clipped to a tiny, heavily zoomed top-left corner instead of a
  // properly scaled cover-crop. Harmless/no-op on native.
  fillImg: { width: "100%", height: "100%" },
  browseImg: { opacity: 0.5, width: "100%", height: "100%" },
  browseTxt: { padding: 12 },
  browseLabel: {
    fontFamily: font.bold,
    fontSize: 15,
    color: palette.onDark,
    letterSpacing: -0.2,
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  browseSub: {
    fontFamily: font.regular,
    fontSize: 11.5,
    color: "rgba(255,255,255,0.92)",
    marginTop: 1,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  /* Grouped list row */
  listRow: { flexDirection: "row", alignItems: "center", gap: 13, paddingVertical: 11 },
  listRowBorder: { borderBottomWidth: 1, borderBottomColor: palette.lineSoft },
  listDate: {
    width: 42,
    height: 44,
    borderRadius: radius.chip,
    backgroundColor: palette.amberSofter,
    alignItems: "center",
    justifyContent: "center",
  },
  listDay: { fontFamily: font.bold, fontSize: 16, lineHeight: 18, color: palette.amberDeep },
  listMonth: { fontFamily: font.bold, fontSize: 8, letterSpacing: 0.5, color: palette.inkMuted },
  listTitle: { fontFamily: font.semibold, fontSize: 14.5, color: palette.ink },
  listMeta: { fontFamily: font.regular, fontSize: 12, color: palette.inkSoft, marginTop: 2 },

  /* News card — same photo-forward language as EventCard, smaller scale */
  newsCard: { width: 178 },
  newsMedia: {
    height: 108,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: palette.sunken,
    marginBottom: 9,
    justifyContent: "flex-start",
    ...shadow.sm,
  },
  newsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    margin: 8,
    backgroundColor: palette.amberBright,
    borderRadius: radius.chip,
    paddingHorizontal: 7,
    paddingVertical: 3.5,
  },
  newsBadgeTxt: { fontFamily: font.bold, fontSize: 9.5, color: palette.ink },
  newsTitle: { fontFamily: font.bold, fontSize: 13.5, lineHeight: 18, color: palette.ink },
  newsBody: { fontFamily: font.regular, fontSize: 12, lineHeight: 16, color: palette.inkSoft, marginTop: 3 },
});
