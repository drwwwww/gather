import { useCallback, useState } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "@react-navigation/native";
import { Icon } from "../components/ui/Icon";
import { Screen, EmptyState, Loader, palette, font, radius, shadow, space } from "../components/ds";
import ConfirmCelebration, { type CelebrationStat } from "../components/app/ConfirmCelebration";
import AnswerButtons from "../components/app/AnswerButtons";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";
import { AREA } from "../theme/areas";
import {
  type ServeRow, dateParts, loadMyServing, localToday, needsAnswer, readyBy, respondTo, serviceLine, withLine,
} from "../lib/serving";

type AwayRow = { start_date: string; end_date: string; note: string | null };

/**
 * Serve — answer first, then your schedule (Planning Center "Schedule" / shift apps).
 * 1. Requests that need an answer, as cards with two equal buttons.
 * 2. Everything coming up as a compact list; a row opens the assignment.
 * 3. Away dates and "serve on another team" as plain rows.
 */
export default function AssignmentsScreen({ navigation }: any) {
  const { user, profile } = useAuth();
  const [rows, setRows] = useState<ServeRow[]>([]);
  const [teammates, setTeammates] = useState<Record<string, string[]>>({});
  const [away, setAway] = useState<AwayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ key: string; message: string } | null>(null);
  const [celebration, setCelebration] = useState<{ roleLine: string; stats: CelebrationStat[] } | null>(null);

  const load = useCallback(async () => {
    if (!supabase || !user?.id || !profile?.church_id) {
      setRows([]); setLoading(false); setRefreshing(false);
      return;
    }
    const [data, awayRes] = await Promise.all([
      loadMyServing(supabase, user.id, profile.church_id),
      (supabase as any)
        .from("volunteer_unavailability")
        .select("start_date, end_date, note")
        .eq("user_id", user.id)
        .gte("end_date", localToday())
        .order("start_date"),
    ]);
    // A backup row mirrors the person serving; once they've said no it isn't yours to show.
    setRows(data.rows.filter((r) => !(r.status === "DECLINED" && r.isBackup)));
    setTeammates(data.teammates);
    setAway((awayRes.data ?? []) as AwayRow[]);
    setLoading(false); setRefreshing(false);
  }, [user?.id, profile?.church_id]);

  useFocusEffect(useCallback(() => { setLoading(true); void load(); }, [load]));

  const requests = rows.filter(needsAnswer);
  const upcoming = rows.filter((r) => !needsAnswer(r));

  const answer = async (r: ServeRow, response: "CONFIRMED" | "DECLINED") => {
    if (!supabase || savingKey) return;
    setSavingKey(r.key); setRowError(null);
    const { error, promoted } = await respondTo(supabase, r, response);
    setSavingKey(null);
    if (error) { setRowError({ key: r.key, message: error }); return; }
    if (response === "DECLINED" && promoted) setRows((list) => list.filter((x) => x.key !== r.key));
    else setRows((list) => list.map((x) => (x.key === r.key ? { ...x, status: response } : x)));
    if (response === "CONFIRMED") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const mine = rows.filter((x) => !x.isBackup);
      setCelebration({
        roleLine: `${r.title} · ${dateParts(r.date).short}`,
        stats: [
          { label: "Confirmed", value: mine.filter((x) => x.status === "CONFIRMED" || x.key === r.key).length, icon: "checkCircle", tone: "success" },
          { label: "Services", value: new Set(mine.filter((x) => x.status === "CONFIRMED" || x.key === r.key).map((x) => x.planId)).size, icon: "calendar", tone: "amber" },
          { label: "Still to answer", value: mine.filter((x) => x.key !== r.key && needsAnswer(x)).length, icon: "clock", tone: "info" },
        ],
      });
    }
  };

  const awayLine = (() => {
    if (away.length === 0) return "None yet — tap to add";
    const first = away[0];
    const range = first.start_date === first.end_date
      ? dateParts(first.start_date).short
      : `${dateParts(first.start_date).short} – ${dateParts(first.end_date).short}`;
    const label = first.note?.trim() ? `${first.note.trim()} · ${range}` : range;
    return away.length > 1 ? `${label} and ${away.length - 1} more` : label;
  })();

  return (
    <Screen>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: space.base, paddingTop: 8, paddingBottom: space.xxl }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={palette.amber} />}
      >
        <View style={styles.head}>
          <Text style={styles.title} accessibilityRole="header">Serve</Text>
          {!loading ? (
            <Text style={styles.sub}>
              {requests.length > 0
                ? `${requests.length} ${requests.length === 1 ? "request needs" : "requests need"} your answer`
                : rows.length > 0 ? "You're all set" : "Nothing scheduled yet"}
            </Text>
          ) : null}
        </View>

        {loading ? (
          <Loader />
        ) : (
          <>
            {requests.length > 0 ? (
              <View style={{ gap: 12 }}>
                {requests.map((r) => {
                  const p = dateParts(r.date);
                  const ready = readyBy(r.startTime);
                  const team = withLine(teammates[r.planId]);
                  return (
                    <View key={r.key} style={styles.request}>
                      <Pressable
                        onPress={() => navigation.navigate("AssignmentDetail", { row: r })}
                        accessibilityRole="button"
                        accessibilityHint="Opens the details"
                        style={styles.requestTop}
                      >
                        <View style={[styles.dateTile, { backgroundColor: AREA.services.tint }]}>
                          <Text style={[styles.dateMon, { color: AREA.services.ink }]}>{p.monthShort.toUpperCase()}</Text>
                          <Text style={[styles.dateDay, { color: AREA.services.ink }]}>{p.day}</Text>
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.reqTitle}>{r.title}</Text>
                          <Text style={styles.reqMeta}>{p.weekdayShort} · {serviceLine(r)}</Text>
                          {ready || team ? (
                            <Text style={styles.reqMeta}>{[ready ? `Be ready by ${ready}` : null, team].filter(Boolean).join(" · ")}</Text>
                          ) : null}
                        </View>
                      </Pressable>
                      {rowError?.key === r.key ? <Text style={styles.error}>{rowError.message}</Text> : null}
                      <View style={{ marginTop: 14 }}>
                        <AnswerButtons busy={savingKey === r.key} onYes={() => void answer(r, "CONFIRMED")} onNo={() => void answer(r, "DECLINED")} />
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : null}

            {upcoming.length > 0 ? (
              <>
                <Text style={styles.section} accessibilityRole="header">Coming up</Text>
                <View style={styles.group}>
                  {upcoming.map((r, i) => {
                    const p = dateParts(r.date);
                    const status = r.isBackup
                      ? { label: "Backup", color: palette.inkSoft }
                      : r.status === "DECLINED"
                        ? { label: "Can't make it", color: palette.dangerInk }
                        : { label: "Going", color: palette.successInk };
                    const ready = readyBy(r.startTime);
                    return (
                      <Pressable
                        key={r.key}
                        onPress={() => navigation.navigate("AssignmentDetail", { row: r })}
                        accessibilityRole="button"
                        accessibilityLabel={`${r.isBackup ? "Backup, " : ""}${r.title}, ${p.long}, ${status.label}`}
                        style={({ pressed }: { pressed: boolean }) => [styles.listRow, i > 0 && styles.listRowBorder, pressed && { backgroundColor: palette.sunken }]}
                      >
                        <View style={styles.listDate}>
                          <Text style={styles.listDow}>{p.weekdayShort.toUpperCase()}</Text>
                          <Text style={styles.listDay}>{p.short}</Text>
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.listTitle} numberOfLines={2}>{r.isBackup ? `Backup · ${r.title}` : r.title}</Text>
                          <Text style={styles.listMeta} numberOfLines={2}>
                            {r.isBackup ? "You're on call if they can't make it" : [serviceLine(r), ready ? `ready by ${ready}` : null].filter(Boolean).join(" · ")}
                          </Text>
                        </View>
                        <View style={styles.statusWrap}>
                          {status.label === "Going" ? <Icon name="check" size={14} color={status.color} /> : null}
                          <Text style={[styles.statusTxt, { color: status.color }]}>{status.label}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}

            {rows.length === 0 ? (
              <EmptyState icon="schedule" title="Nothing scheduled yet" body="When your team asks you to serve, it shows up here for you to answer." />
            ) : null}

            <View style={{ gap: 10, marginTop: 24 }}>
              <Pressable
                onPress={() => navigation.navigate("AwayDates")}
                accessibilityRole="button"
                style={({ pressed }: { pressed: boolean }) => [styles.linkRow, pressed && { opacity: 0.85 }]}
              >
                <Icon name="calendar" size={20} color={palette.inkSoft} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.linkTitle}>Dates you're away</Text>
                  <Text style={styles.linkSub} numberOfLines={1}>{awayLine}</Text>
                </View>
                <Icon name="chevronRight" size={18} color={palette.inkMuted} />
              </Pressable>
              <Pressable
                onPress={() => navigation.navigate("RequestToServe")}
                accessibilityRole="button"
                style={({ pressed }: { pressed: boolean }) => [styles.linkRow, pressed && { opacity: 0.85 }]}
              >
                <Icon name="add" size={20} color={palette.inkSoft} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.linkTitle}>Serve on another team</Text>
                  <Text style={styles.linkSub} numberOfLines={1}>Ask to join a team you're not on yet</Text>
                </View>
                <Icon name="chevronRight" size={18} color={palette.inkMuted} />
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
      <ConfirmCelebration
        visible={celebration !== null}
        title="Thank you for serving"
        subtitle="Your team can see you're in. We'll send a reminder before the service."
        roleLine={celebration?.roleLine}
        stats={celebration?.stats ?? []}
        onDismiss={() => setCelebration(null)}
      />
    </Screen>
  );
}

const card = { backgroundColor: palette.surface, borderRadius: 20, ...shadow.sm } as const;

const styles = StyleSheet.create({
  head: { paddingHorizontal: 4, paddingTop: 8, marginBottom: 16 },
  title: { fontFamily: font.bold, fontSize: 28, letterSpacing: -0.5, color: palette.ink },
  sub: { fontFamily: font.regular, fontSize: 15, color: palette.inkSoft, marginTop: 2 },

  request: { ...card, padding: 16 },
  requestTop: { flexDirection: "row", gap: 14 },
  dateTile: { width: 48, height: 52, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  dateMon: { fontFamily: font.bold, fontSize: 10, letterSpacing: 0.6 },
  dateDay: { fontFamily: font.bold, fontSize: 20, lineHeight: 22 },
  reqTitle: { fontFamily: font.semibold, fontSize: 17, color: palette.ink },
  reqMeta: { fontFamily: font.regular, fontSize: 14, lineHeight: 19, color: palette.inkSoft, marginTop: 2 },
  error: { fontFamily: font.regular, fontSize: 13, color: palette.dangerInk, marginTop: 10 },

  section: { fontFamily: font.bold, fontSize: 20, letterSpacing: -0.3, color: palette.ink, marginTop: 28, marginBottom: 10, marginHorizontal: 4 },
  group: { ...card, overflow: "hidden" },
  listRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, paddingHorizontal: 18, minHeight: 64 },
  listRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.line },
  listDate: { width: 56 },
  listDow: { fontFamily: font.bold, fontSize: 12, color: palette.inkSoft },
  listDay: { fontFamily: font.semibold, fontSize: 15, color: palette.ink },
  listTitle: { fontFamily: font.semibold, fontSize: 16, color: palette.ink },
  listMeta: { fontFamily: font.regular, fontSize: 14, color: palette.inkSoft, marginTop: 1 },
  statusWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
  statusTxt: { fontFamily: font.semibold, fontSize: 13 },

  linkRow: { ...card, borderRadius: radius.lg, flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 18, minHeight: 64 },
  linkTitle: { fontFamily: font.semibold, fontSize: 16, color: palette.ink },
  linkSub: { fontFamily: font.regular, fontSize: 14, color: palette.inkSoft, marginTop: 1 },
});
