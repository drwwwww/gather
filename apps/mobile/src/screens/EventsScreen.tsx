import { useCallback, useRef, useState } from "react";
import { View, Text, Image, ScrollView, Pressable, RefreshControl, StyleSheet, FlatList } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Icon } from "../components/ui/Icon";
import {
  Screen, EmptyState, Loader, Eyebrow, LinearGradient,
  palette, font, gradient, radius, shadow, space,
} from "../components/ds";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";

type EventRow = { id: string; title: string; location: string | null; start_at: string; end_at: string | null; image_url: string | null };

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function formatTime(iso: string): string {
  try { return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }); } catch { return ""; }
}
function sameDay(iso: string, dateStr: string): boolean {
  return iso.startsWith(dateStr);
}

const ITEM_W = 52;
const PAST_DAYS = 30;
const FUTURE_DAYS = 60;

export default function EventsScreen({ navigation }: any) {
  const { user, profile } = useAuth();
  const stripRef = useRef<FlatList>(null);

  const today = new Date();
  const todayStr = localDateStr(today);
  const todayIndex = PAST_DAYS;

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const days = Array.from({ length: PAST_DAYS + FUTURE_DAYS + 1 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + (i - PAST_DAYS));
    return d;
  });

  const selectedD = new Date(selectedDate + "T00:00:00");
  const eventsForDay = events.filter((e) => sameDay(e.start_at, selectedDate));

  const load = useCallback(async () => {
    if (!supabase || !user?.id || !profile?.church_id) {
      setEvents([]); setLoading(false); setRefreshing(false);
      return;
    }
    const windowStart = new Date(today);
    windowStart.setDate(windowStart.getDate() - PAST_DAYS);
    const windowEnd = new Date(today);
    windowEnd.setDate(windowEnd.getDate() + FUTURE_DAYS + 1);
    const { data, error } = await supabase
      .from("events")
      .select("id, title, location, start_at, end_at, image_url")
      .eq("church_id", profile.church_id)
      .eq("is_cancelled", false)
      .gte("start_at", windowStart.toISOString())
      .lt("start_at", windowEnd.toISOString())
      .order("start_at", { ascending: true })
      .limit(400);
    if (!error) setEvents((data ?? []) as EventRow[]);
    setLoading(false); setRefreshing(false);
  }, [user?.id, profile?.church_id]);

  useFocusEffect(useCallback(() => { setLoading(true); void load(); }, [load]));

  const selectDay = (dateStr: string, index: number) => {
    setSelectedDate(dateStr);
    stripRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
  };
  const goToday = () => {
    setSelectedDate(todayStr);
    stripRef.current?.scrollToIndex({ index: todayIndex, animated: true, viewPosition: 0.5 });
  };

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Eyebrow color="muted">Events</Eyebrow>
            <Text style={styles.dayName}>{FULL_DAYS[selectedD.getDay()]}</Text>
          </View>
          {selectedDate !== todayStr ? (
            <Pressable onPress={goToday} style={styles.todayBtn} hitSlop={6}>
              <Text style={styles.todayTxt}>Today</Text>
            </Pressable>
          ) : null}
        </View>

        <FlatList
          ref={stripRef}
          data={days}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(d) => localDateStr(d)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
          initialScrollIndex={todayIndex}
          getItemLayout={(_, index) => ({ length: ITEM_W, offset: ITEM_W * index, index })}
          renderItem={({ item: d, index }) => {
            const ds = localDateStr(d);
            const isSelected = ds === selectedDate;
            const isToday = ds === todayStr;
            const hasEvent = events.some((e) => sameDay(e.start_at, ds));
            return (
              <Pressable onPress={() => selectDay(ds, index)} style={styles.dayItem}>
                <Text style={[styles.dayLetter, isSelected && { color: palette.amberDeep }]}>{DAY_LETTERS[d.getDay()]}</Text>
                {isSelected ? (
                  <LinearGradient colors={gradient.amber} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.dayCircle, shadow.amber]}>
                    <Text style={[styles.dayNum, { color: palette.onDark, fontFamily: font.bold }]}>{d.getDate()}</Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.dayCircle, styles.dayCircleIdle, isToday && styles.dayCircleToday]}>
                    <Text style={[styles.dayNum, isToday && { color: palette.amberDeep }]}>{d.getDate()}</Text>
                  </View>
                )}
                <View style={styles.dotWrap}>
                  {hasEvent ? <View style={[styles.dot, isSelected && { backgroundColor: palette.amber }]} /> : null}
                </View>
              </Pressable>
            );
          }}
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 130, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={palette.amber} />}
      >
        {loading ? (
          <Loader />
        ) : eventsForDay.length === 0 ? (
          <EmptyState icon="events" title="Nothing scheduled" body="No events on this day." />
        ) : (
          <View style={{ paddingHorizontal: 16 }}>
            {eventsForDay.map((event, idx) => {
              const isActive = idx === 0 && selectedDate === todayStr;
              const isLast = idx === eventsForDay.length - 1;
              return (
                <Pressable key={event.id} onPress={() => navigation.navigate("EventDetail", { eventId: event.id })} style={styles.row}>
                  <View style={styles.timeCol}>
                    <Text style={[styles.timeStart, isActive && { color: palette.amberDeep, fontFamily: font.bold }]}>{formatTime(event.start_at)}</Text>
                    {event.end_at ? <Text style={styles.timeEnd}>{formatTime(event.end_at)}</Text> : null}
                  </View>
                  <View style={styles.track}>
                    <View style={[styles.trackDot, isActive && { backgroundColor: palette.amber }]} />
                    {!isLast ? <View style={styles.trackLine} /> : null}
                  </View>
                  {isActive ? (
                    <LinearGradient colors={gradient.amber} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.eventCard, styles.eventCardActive, styles.eventCardRow]}>
                      {event.image_url ? <Image source={{ uri: event.image_url }} style={styles.thumb} /> : null}
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={[styles.eventTitle, { color: palette.onDark }]} numberOfLines={1}>{event.title}</Text>
                        {event.location ? (
                          <View style={styles.metaRow}>
                            <Icon name="mapPin" size={13} color={palette.onDarkSoft} />
                            <Text style={[styles.metaTxt, { color: palette.onDarkSoft }]} numberOfLines={1}>{event.location}</Text>
                          </View>
                        ) : null}
                      </View>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.eventCard, styles.eventCardRow]}>
                      {event.image_url ? <Image source={{ uri: event.image_url }} style={styles.thumb} /> : null}
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                        {event.location ? (
                          <View style={styles.metaRow}>
                            <Icon name="mapPin" size={13} color={palette.inkMuted} />
                            <Text style={styles.metaTxt} numberOfLines={1}>{event.location}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {},
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: space.gutter, paddingTop: 8 },
  dayName: { ...({ fontFamily: font.bold, fontSize: 22 } as any), color: palette.ink, letterSpacing: -0.3, marginTop: 2 },
  todayBtn: { backgroundColor: palette.glassStrong, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 9, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.glassBorder },
  todayTxt: { fontFamily: font.bold, fontSize: 13, color: palette.amberDeep },

  dayItem: { width: 44, alignItems: "center", marginRight: 8 },
  dayLetter: { fontFamily: font.semibold, fontSize: 11, color: palette.inkMuted, marginBottom: 6, textTransform: "uppercase" },
  dayCircle: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  dayCircleIdle: { backgroundColor: palette.glassStrong, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.glassBorder },
  dayCircleToday: { borderWidth: 1.5, borderColor: palette.amber },
  dayNum: { fontFamily: font.semibold, fontSize: 15, color: palette.inkSoft },
  dotWrap: { height: 10, justifyContent: "center", marginTop: 4 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: palette.amber },

  row: { flexDirection: "row", alignItems: "flex-start", marginBottom: 4 },
  timeCol: { width: 66, paddingTop: 12, alignItems: "flex-end", paddingRight: 12 },
  timeStart: { fontFamily: font.semibold, fontSize: 12, color: palette.inkSoft },
  timeEnd: { fontFamily: font.regular, fontSize: 11, color: palette.inkMuted, marginTop: 2 },
  track: { width: 20, alignItems: "center", paddingTop: 16 },
  trackDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: palette.line, zIndex: 1 },
  trackLine: { width: 2, flex: 1, minHeight: 44, backgroundColor: palette.line, marginTop: 2 },
  eventCard: { flex: 1, marginLeft: 10, marginBottom: 12, borderRadius: radius.lg, padding: 16, backgroundColor: palette.surface, ...shadow.sm },
  eventCardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  eventCardActive: { ...shadow.amber },
  thumb: { width: 48, height: 48, borderRadius: radius.sm, backgroundColor: palette.sunken },
  eventTitle: { fontFamily: font.bold, fontSize: 15, color: palette.ink },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 5 },
  metaTxt: { fontFamily: font.regular, fontSize: 12, color: palette.inkMuted, flex: 1 },
});
