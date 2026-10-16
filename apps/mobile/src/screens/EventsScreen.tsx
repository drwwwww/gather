import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
  RefreshControl,
  Animated,
  Share,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as Location from "expo-location";
import { Icon } from "../components/ui/Icon";
import { Screen, LinearGradient, palette, font, gradient, radius, shadow, space } from "../components/ds";
import { RiseIn, Shimmer, usePressScale } from "../components/ds/motion";
import { eventFallback } from "../lib/churchImagery";
import { distanceMiles, formatDistance } from "../lib/geo";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";

type EventRow = {
  id: string;
  title: string;
  location: string | null;
  start_at: string;
  end_at: string | null;
  image_url: string | null;
  churchName?: string;
  distanceMi?: number | null;
};

type FilterKey = "upcoming" | "week" | "month" | "past";
type Tab = "mine" | "nearby";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "upcoming", label: "All upcoming" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "past", label: "Past" },
];



function dayLine(iso: string): string {
  try {
    const d = new Date(iso);
    const day = d.toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short" });
    const time = d.toLocaleString(undefined, { hour: "numeric", minute: "2-digit" });
    return `${day} • ${time}`;
  } catch {
    return iso;
  }
}
function isSoon(iso: string): boolean {
  const h = (new Date(iso).getTime() - Date.now()) / 3600000;
  return h >= 0 && h < 72;
}

export default function EventsScreen({ navigation }: any) {
  const { user, profile } = useAuth();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("upcoming");
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("mine");

  const [nearbyEvents, setNearbyEvents] = useState<EventRow[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyLoaded, setNearbyLoaded] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);

  const load = useCallback(async () => {
    if (!supabase || !user?.id || !profile?.church_id) {
      setEvents([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    const from = new Date();
    from.setDate(from.getDate() - 120);
    const to = new Date();
    to.setDate(to.getDate() + 365);

    const { data, error } = await supabase
      .from("events")
      .select("id, title, location, start_at, end_at, image_url")
      .eq("church_id", profile.church_id)
      .eq("is_cancelled", false)
      .gte("start_at", from.toISOString())
      .lt("start_at", to.toISOString())
      .order("start_at", { ascending: true })
      .limit(400);

    if (!error) setEvents((data ?? []) as EventRow[]);
    setLoading(false);
    setRefreshing(false);
  }, [user?.id, profile?.church_id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load])
  );

  const loadNearby = useCallback(async () => {
    if (!supabase || !profile?.church_id) return;
    setNearbyLoading(true);
    setLocationDenied(false);

    let origin: { latitude: number; longitude: number } | null = null;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        origin = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      } else {
        setLocationDenied(true);
      }
    } catch {
      setLocationDenied(true);
    }

    const { data: churchesData } = await supabase
      .from("churches")
      .select("id, name, latitude, longitude")
      .eq("discoverable", true)
      .neq("id", profile.church_id);

    const churches = (churchesData ?? []) as { id: string; name: string; latitude: number | null; longitude: number | null }[];
    if (!churches.length) {
      setNearbyEvents([]);
      setNearbyLoading(false);
      setNearbyLoaded(true);
      return;
    }

    const churchDistance = new Map<string, number | null>();
    for (const c of churches) {
      churchDistance.set(
        c.id,
        origin && c.latitude != null && c.longitude != null
          ? distanceMiles(origin, { latitude: c.latitude, longitude: c.longitude })
          : null
      );
    }
    const churchName = new Map(churches.map((c) => [c.id, c.name]));

    const nowIso = new Date().toISOString();
    const { data: eventsData } = await supabase
      .from("events")
      .select("id, title, location, start_at, end_at, image_url, church_id")
      .in("church_id", churches.map((c) => c.id))
      .eq("is_cancelled", false)
      .eq("audience", "ALL")
      .gte("start_at", nowIso)
      .order("start_at", { ascending: true })
      .limit(200);

    const rows = ((eventsData ?? []) as (EventRow & { church_id: string })[]).map((e) => ({
      ...e,
      churchName: churchName.get(e.church_id),
      distanceMi: churchDistance.get(e.church_id) ?? null,
    }));

    // Nearest church first when we have a location; otherwise soonest first.
    rows.sort((a, b) => {
      if (a.distanceMi != null && b.distanceMi != null) return a.distanceMi - b.distanceMi;
      if (a.distanceMi != null) return -1;
      if (b.distanceMi != null) return 1;
      return new Date(a.start_at).getTime() - new Date(b.start_at).getTime();
    });

    setNearbyEvents(rows);
    setNearbyLoading(false);
    setNearbyLoaded(true);
  }, [profile?.church_id]);

  useEffect(() => {
    if (tab === "nearby" && !nearbyLoaded) void loadNearby();
  }, [tab, nearbyLoaded, loadNearby]);

  const visible = useMemo(() => {
    const source = tab === "mine" ? events : nearbyEvents;
    const now = Date.now();
    const upcoming = source.filter((e) => new Date(e.start_at).getTime() >= now);
    let base: EventRow[];
    if (filter === "upcoming") base = upcoming;
    else if (filter === "past") base = source.filter((e) => new Date(e.start_at).getTime() < now).reverse();
    else {
      const horizon = new Date();
      horizon.setDate(horizon.getDate() + (filter === "week" ? 7 : 31));
      base = upcoming.filter((e) => new Date(e.start_at).getTime() <= horizon.getTime());
    }
    const q = search.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.location ?? "").toLowerCase().includes(q) ||
        (e.churchName ?? "").toLowerCase().includes(q)
    );
  }, [events, nearbyEvents, tab, filter, search]);

  const onShare = async (e: EventRow) => {
    try {
      await Share.share({
        message: `${e.title}\n${dayLine(e.start_at)}${e.location ? `\n${e.location}` : ""}`,
      });
    } catch {
      /* user dismissed the sheet — nothing to recover from */
    }
  };

  return (
    <Screen>
      {/* Search bar (Eventbrite) — filters whichever tab is active */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Icon name="search" size={19} color={palette.ink} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Find something to go to"
            placeholderTextColor={palette.inkMuted}
            style={styles.searchInput}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Your church / Nearby churches tabs */}
      <View style={styles.tabRow}>
        <Pressable style={[styles.tab, tab === "mine" && styles.tabActive]} onPress={() => setTab("mine")}>
          <Text style={[styles.tabTxt, tab === "mine" && styles.tabTxtActive]}>Your church</Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === "nearby" && styles.tabActive]} onPress={() => setTab("nearby")}>
          <Text style={[styles.tabTxt, tab === "nearby" && styles.tabTxtActive]}>Nearby churches</Text>
        </Pressable>
      </View>

      {tab === "nearby" && locationDenied ? (
        <View style={styles.noticeRow}>
          <Icon name="mapPin" size={14} color={palette.inkMuted} />
          <Text style={styles.noticeTxt}>Enable location to sort by distance — showing soonest first.</Text>
        </View>
      ) : null}

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        style={{ flexGrow: 0 }}
      >
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipTxt, active && styles.chipTxtActive]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: space.xxl, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              if (tab === "mine") {
                setRefreshing(true);
                void load();
              } else {
                setNearbyLoaded(false);
              }
            }}
            tintColor={palette.amber}
          />
        }
      >
        {(tab === "mine" ? loading : nearbyLoading) ? (
          <View style={{ paddingHorizontal: space.gutter, gap: 22 }}>
            {[0, 1].map((i) => (
              <View key={i} style={{ gap: 10 }}>
                <Shimmer style={{ height: 186, borderRadius: radius.lg }} />
                <Shimmer style={{ height: 16, width: "70%" }} />
                <Shimmer style={{ height: 13, width: "45%" }} />
              </View>
            ))}
          </View>
        ) : visible.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyGlyph}>
              <Icon name="events" size={26} color={palette.amberDeep} />
            </View>
            <Text style={styles.emptyTitle}>
              {search.trim()
                ? "No matches"
                : tab === "nearby"
                ? "No nearby events yet"
                : filter === "past"
                ? "No past events"
                : "Nothing on the calendar"}
            </Text>
            <Text style={styles.emptyBody}>
              {search.trim()
                ? `Nothing matches "${search.trim()}".`
                : tab === "nearby"
                ? "No other churches nearby have public events posted right now."
                : filter === "past"
                ? "Events your church has already held will appear here."
                : "When your church schedules something, you'll find it here first."}
            </Text>
          </View>
        ) : (
          visible.map((e, i) => (
            <RiseIn key={e.id} index={Math.min(i, 6)}>
              <EventCard
                event={e}
                saved={!!saved[e.id]}
                onToggleSave={() => setSaved((s) => ({ ...s, [e.id]: !s[e.id] }))}
                onShare={() => void onShare(e)}
                onPress={() => navigation.navigate("EventDetail", { eventId: e.id })}
              />
            </RiseIn>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

function EventCard({
  event,
  saved,
  onToggleSave,
  onShare,
  onPress,
}: {
  event: EventRow;
  saved: boolean;
  onToggleSave: () => void;
  onShare: () => void;
  onPress: () => void;
}) {
  const press = usePressScale(0.985);
  const soon = isSoon(event.start_at);

  return (
    <View style={styles.cardWrap}>
      <Animated.View style={press.style}>
        <Pressable onPress={onPress} onPressIn={press.onPressIn} onPressOut={press.onPressOut}>
          <View style={styles.media}>
            <Image
              source={event.image_url ? { uri: event.image_url } : eventFallback(event.id)}
              style={[StyleSheet.absoluteFill as any, styles.fillImg]}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["rgba(24,12,2,0.30)", "rgba(24,12,2,0.05)"]}
              style={StyleSheet.absoluteFill}
            />
            {soon ? (
              <View style={styles.soonBadge}>
                <Icon name="clock" size={11} color={palette.ink} />
                <Text style={styles.soonTxt}>Starting soon</Text>
              </View>
            ) : null}
            {event.churchName ? (
              <View style={styles.churchBadge}>
                <Icon name="church" size={11} color={palette.ink} />
                <Text style={styles.churchBadgeTxt} numberOfLines={1}>
                  {event.churchName}{event.distanceMi != null ? ` · ${formatDistance(event.distanceMi)}` : ""}
                </Text>
              </View>
            ) : null}
          </View>
        </Pressable>
      </Animated.View>

      <View style={styles.metaRow}>
        <Pressable style={{ flex: 1, minWidth: 0 }} onPress={onPress}>
          <Text style={styles.title} numberOfLines={2}>
            {event.title}
          </Text>
          <Text style={styles.when} numberOfLines={1}>
            {dayLine(event.start_at)}
          </Text>
          <Text style={styles.where} numberOfLines={1}>
            {event.location?.trim() || "Location to be confirmed"}
          </Text>
          <View style={styles.freeRow}>
            <Text style={styles.free}>Free</Text>
            <Text style={styles.freeSub}>· All welcome</Text>
          </View>
        </Pressable>

        <View style={styles.iconCol}>
          <Pressable onPress={onShare} hitSlop={8} style={styles.iconBtn} accessibilityLabel="Share event">
            <Icon name="link" size={19} color={palette.inkSoft} />
          </Pressable>
          <Pressable
            onPress={onToggleSave}
            hitSlop={8}
            style={styles.iconBtn}
            accessibilityLabel={saved ? "Remove from saved" : "Save event"}
          >
            <Icon
              name={saved ? "checkCircle" : "add"}
              size={20}
              color={saved ? palette.amberDeep : palette.inkSoft}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // See HomeScreen.tsx's fillImg comment — required alongside
  // StyleSheet.absoluteFill for react-native-web to scale-crop correctly.
  fillImg: { width: "100%", height: "100%" },
  header: { paddingHorizontal: space.gutter, paddingTop: 6, paddingBottom: 12 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: palette.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 12,
    ...shadow.sm,
  },
  searchInput: { flex: 1, fontFamily: font.semibold, fontSize: 14.5, color: palette.ink, padding: 0 },

  tabRow: {
    flexDirection: "row",
    marginHorizontal: space.gutter,
    marginBottom: 12,
    backgroundColor: palette.surface,
    borderRadius: radius.pill,
    padding: 3,
    ...shadow.sm,
  },
  tab: { flex: 1, alignItems: "center", paddingVertical: 9, borderRadius: radius.pill },
  tabActive: { backgroundColor: palette.ink },
  tabTxt: { fontFamily: font.semibold, fontSize: 13, color: palette.inkSoft },
  tabTxtActive: { color: palette.onDark },

  noticeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: space.gutter,
    marginBottom: 10,
  },
  noticeTxt: { fontFamily: font.regular, fontSize: 12, color: palette.inkMuted, flex: 1 },

  churchBadge: {
    position: "absolute",
    bottom: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    maxWidth: "70%",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: radius.chip,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  churchBadgeTxt: { fontFamily: font.bold, fontSize: 11, color: palette.ink, flexShrink: 1 },

  chipRow: { paddingHorizontal: space.gutter, gap: 8, paddingBottom: 14 },
  chip: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.line,
  },
  chipActive: { backgroundColor: palette.ink, borderColor: palette.ink },
  chipTxt: { fontFamily: font.semibold, fontSize: 13, color: palette.inkSoft },
  chipTxtActive: { color: palette.onDark },

  cardWrap: { paddingHorizontal: space.gutter, marginBottom: 26 },
  media: {
    height: 186,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: palette.sunken,
    ...shadow.sm,
  },
  soonBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: palette.amberBright,
    borderRadius: radius.chip,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  soonTxt: { fontFamily: font.bold, fontSize: 11, color: palette.ink },

  metaRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginTop: 12 },
  title: { fontFamily: font.bold, fontSize: 17.5, lineHeight: 23, color: palette.ink, letterSpacing: -0.3 },
  when: { fontFamily: font.semibold, fontSize: 13.5, color: palette.inkSoft, marginTop: 5 },
  where: { fontFamily: font.regular, fontSize: 13, color: palette.inkMuted, marginTop: 2 },
  freeRow: { flexDirection: "row", alignItems: "baseline", gap: 5, marginTop: 7 },
  free: { fontFamily: font.bold, fontSize: 14, color: palette.ink },
  freeSub: { fontFamily: font.regular, fontSize: 12.5, color: palette.inkMuted },

  iconCol: { gap: 10, paddingTop: 2 },
  iconBtn: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },

  empty: { alignItems: "center", paddingHorizontal: 40, paddingTop: 60 },
  emptyGlyph: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: palette.amberSofter,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  emptyTitle: { fontFamily: font.bold, fontSize: 17, color: palette.ink, textAlign: "center" },
  emptyBody: {
    fontFamily: font.regular,
    fontSize: 14,
    lineHeight: 20,
    color: palette.inkSoft,
    textAlign: "center",
    marginTop: 7,
  },
});
