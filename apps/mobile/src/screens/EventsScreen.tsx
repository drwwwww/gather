import { useCallback, useRef, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Pressable,
  ActivityIndicator, RefreshControl, StyleSheet, FlatList,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { AppShell } from "../components/app/AppShell";
import { StitchTabAppBar } from "../components/app/StitchTabAppBar";
import { EmptyState } from "../components/app/EmptyState";
import { Icon } from "../components/ui/Icon";
import { theme } from "../theme/theme";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type EventRow = {
  id: string;
  title: string;
  location: string | null;
  start_at: string;
  end_at: string | null;
};

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    let h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? "PM" : "AM";
    h = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
  } catch {
    return "";
  }
}

function sameDay(iso: string, dateStr: string): boolean {
  return iso.startsWith(dateStr);
}

export default function EventsScreen({ navigation }: any) {
  const { user, profile } = useAuth();
  const insets = useSafeAreaInsets();
  const stripRef = useRef<FlatList>(null);

  const today = new Date();
  const todayStr = localDateStr(today);

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 60-day window starting today
  const days = Array.from({ length: 60 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d;
  });

  const selectedD = new Date(selectedDate + "T00:00:00");
  const eventsForDay = events.filter((e) => sameDay(e.start_at, selectedDate));

  const load = useCallback(async () => {
    if (!supabase || !user?.id || !profile?.church_id) {
      setEvents([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from("events")
      .select("id, title, location, start_at, end_at")
      .eq("church_id", profile.church_id)
      .eq("is_cancelled", false)
      .gte("start_at", nowIso)
      .order("start_at", { ascending: true })
      .limit(200);

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

  const selectDay = (dateStr: string, index: number) => {
    setSelectedDate(dateStr);
    stripRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
  };

  const goToday = () => {
    setSelectedDate(todayStr);
    stripRef.current?.scrollToIndex({ index: 0, animated: true, viewPosition: 0 });
  };

  return (
    <AppShell>
      {/* ── Fixed header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <StitchTabAppBar navigation={navigation} />
        <View style={[styles.headerRow, { paddingTop: 4 }]}>
          <View>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
              <Text style={styles.headerDay}>{selectedD.getDate()}</Text>
              <View>
                <Text style={styles.headerWeekday}>{FULL_DAYS[selectedD.getDay()]}</Text>
                <Text style={styles.headerMonthYear}>
                  {MONTH_NAMES[selectedD.getMonth()]} {selectedD.getFullYear()}
                </Text>
              </View>
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {selectedDate !== todayStr && (
              <TouchableOpacity onPress={goToday} style={styles.todayPill}>
                <Text style={styles.todayPillText}>Today</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Week strip ── */}
        <FlatList
          ref={stripRef}
          data={days}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(d) => localDateStr(d)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}
          initialScrollIndex={0}
          getItemLayout={(_, index) => ({ length: 52, offset: 52 * index, index })}
          renderItem={({ item: d, index }) => {
            const ds = localDateStr(d);
            const isSelected = ds === selectedDate;
            const isToday = ds === todayStr;
            return (
              <Pressable
                onPress={() => selectDay(ds, index)}
                style={[styles.dayItem, isSelected && styles.dayItemSelected]}
              >
                <Text style={[styles.dayLetter, isSelected && styles.dayLetterSelected]}>
                  {DAY_LETTERS[d.getDay()]}
                </Text>
                <View style={[styles.dayCircle, isSelected && styles.dayCircleSelected, isToday && !isSelected && styles.dayCircleToday]}>
                  <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected, isToday && !isSelected && styles.dayNumberToday]}>
                    {d.getDate()}
                  </Text>
                </View>
                {events.some((e) => sameDay(e.start_at, ds)) && (
                  <View style={[styles.dot, isSelected && styles.dotSelected]} />
                )}
              </Pressable>
            );
          }}
        />
      </View>

      {/* ── Timeline list ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: theme.spacing.xl }} />
        ) : eventsForDay.length === 0 ? (
          <EmptyState title="No events" description="Nothing scheduled for this day." />
        ) : (
          <View style={{ paddingHorizontal: 16 }}>
            {eventsForDay.map((event, idx) => {
              const isFirst = idx === 0;
              const isToday = selectedDate === todayStr;
              const isActive = isFirst && isToday;
              return (
                <TouchableOpacity
                  key={event.id}
                  onPress={() => navigation.navigate("EventDetail", { eventId: event.id })}
                  activeOpacity={0.85}
                  style={styles.timelineRow}
                >
                  {/* Time column */}
                  <View style={styles.timeCol}>
                    <Text style={[styles.timeStart, isActive && styles.timeActive]}>
                      {formatTime(event.start_at)}
                    </Text>
                    {event.end_at && (
                      <Text style={styles.timeEnd}>{formatTime(event.end_at)}</Text>
                    )}
                  </View>

                  {/* Timeline line + dot */}
                  <View style={styles.timelineTrack}>
                    <View style={[styles.trackDot, isActive && styles.trackDotActive]} />
                    <View style={[styles.trackLine, idx === eventsForDay.length - 1 && { opacity: 0 }]} />
                  </View>

                  {/* Event card */}
                  <View style={[styles.eventCard, isActive && styles.eventCardActive]}>
                    <Text style={[styles.eventTitle, isActive && styles.eventTitleActive]} numberOfLines={1}>
                      {event.title}
                    </Text>
                    {event.location ? (
                      <View style={styles.eventMeta}>
                        <Icon name="calendar" size={13} color={isActive ? "rgba(255,255,255,0.75)" : theme.colors.textMuted} />
                        <Text style={[styles.eventMetaText, isActive && styles.eventMetaActive]} numberOfLines={1}>
                          {event.location}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  // Header
  header: {
    backgroundColor: theme.colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerDay: {
    fontSize: 52,
    fontWeight: "800",
    color: theme.colors.textPrimary,
    lineHeight: 56,
  },
  headerWeekday: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  headerMonthYear: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  todayPill: {
    backgroundColor: theme.colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  todayPillText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.primary,
  },

  // Week strip
  dayItem: {
    width: 44,
    alignItems: "center",
    paddingVertical: 4,
    marginRight: 8,
  },
  dayItemSelected: {},
  dayLetter: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.textMuted,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  dayLetterSelected: {
    color: theme.colors.primary,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircleSelected: {
    backgroundColor: theme.colors.primary,
  },
  dayCircleToday: {
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  dayNumberSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  dayNumberToday: {
    color: theme.colors.primary,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
    marginTop: 4,
    opacity: 0.5,
  },
  dotSelected: {
    opacity: 1,
    backgroundColor: "#fff",
  },

  // Timeline
  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  timeCol: {
    width: 72,
    paddingTop: 10,
    alignItems: "flex-end",
    paddingRight: 12,
  },
  timeStart: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  timeEnd: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  timeActive: {
    color: theme.colors.primary,
  },
  timelineTrack: {
    width: 20,
    alignItems: "center",
    paddingTop: 14,
  },
  trackDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.border,
    borderWidth: 2,
    borderColor: theme.colors.surface2,
    zIndex: 1,
  },
  trackDotActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primarySoft,
  },
  trackLine: {
    width: 2,
    flex: 1,
    minHeight: 48,
    backgroundColor: theme.colors.border,
    marginTop: 2,
  },
  eventCard: {
    flex: 1,
    marginLeft: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    padding: 14,
    marginBottom: 4,
  },
  eventCardActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  eventTitleActive: {
    color: "#fff",
  },
  eventMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 5,
  },
  eventMetaText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    flex: 1,
  },
  eventMetaActive: {
    color: "rgba(255,255,255,0.8)",
  },
});
