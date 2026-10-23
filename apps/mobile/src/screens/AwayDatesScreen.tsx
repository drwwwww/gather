import { useCallback, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "@react-navigation/native";
import { Icon } from "../components/ui/Icon";
import { AppBar, Loader, Screen, palette, font, space } from "../components/ds";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";
import { AREA } from "../theme/areas";
import { dateParts, loadMyServing, localToday } from "../lib/serving";

type AwayRow = { id: string; start_date: string; end_date: string; note: string | null };

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const MONTHS_AHEAD = 6;
const DOW = ["S", "M", "T", "W", "T", "F", "S"];

/**
 * Away dates on a month calendar (shift apps' time-off pattern). Only service
 * days can be tapped; days you already serve are tinted, and marking one of
 * those away says so, because your team still needs to find someone.
 */
export default function AwayDatesScreen({ navigation }: any) {
  const { user, profile } = useAuth();
  const [serviceDows, setServiceDows] = useState<Set<number>>(new Set());
  const [serving, setServing] = useState<Set<string>>(new Set());
  const [away, setAway] = useState<AwayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);
  const today = localToday();

  const load = useCallback(async () => {
    if (!supabase || !user?.id || !profile?.church_id) return;
    const [timesRes, awayRes, mine] = await Promise.all([
      supabase.from("service_times").select("day_of_week").eq("church_id", profile.church_id),
      (supabase as any).from("volunteer_unavailability").select("id, start_date, end_date, note").eq("user_id", user.id).gte("end_date", today).order("start_date"),
      loadMyServing(supabase, user.id, profile.church_id),
    ]);
    setServiceDows(new Set(((timesRes.data ?? []) as { day_of_week: number }[]).map((t) => t.day_of_week)));
    setAway((awayRes.data ?? []) as AwayRow[]);
    setServing(new Set(mine.rows.filter((r) => !r.isBackup && r.status !== "DECLINED").map((r) => r.date)));
    setLoading(false);
  }, [user?.id, profile?.church_id, today]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const awayFor = (day: string) => away.find((a) => a.start_date <= day && a.end_date >= day);

  const month = useMemo(() => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const y = first.getFullYear(), m = first.getMonth();
    const days = new Date(y, m + 1, 0).getDate();
    const cells: (null | { date: string; day: number; dow: number })[] = Array(first.getDay()).fill(null);
    for (let d = 1; d <= days; d++) cells.push({ date: ymd(y, m, d), day: d, dow: (first.getDay() + d - 1) % 7 });
    return { label: first.toLocaleDateString("en-US", { month: "long", year: "numeric" }), cells };
  }, [monthOffset]);

  const toggle = async (day: string) => {
    if (!supabase || !user?.id || !profile?.church_id || busy) return;
    setBusy(day); setError(null);
    Haptics.selectionAsync().catch(() => {});
    const existing = awayFor(day);
    if (existing) {
      // Taking one day out of a longer stretch keeps the rest of it.
      const { error: e } = await (supabase as any).from("volunteer_unavailability").delete().eq("id", existing.id);
      if (!e && existing.start_date !== existing.end_date) {
        const prev = new Date(`${day}T12:00:00`); prev.setDate(prev.getDate() - 1);
        const next = new Date(`${day}T12:00:00`); next.setDate(next.getDate() + 1);
        const pieces = [
          existing.start_date < day ? { start_date: existing.start_date, end_date: ymd(prev.getFullYear(), prev.getMonth(), prev.getDate()) } : null,
          existing.end_date > day ? { start_date: ymd(next.getFullYear(), next.getMonth(), next.getDate()), end_date: existing.end_date } : null,
        ].filter(Boolean) as { start_date: string; end_date: string }[];
        if (pieces.length) {
          await (supabase as any).from("volunteer_unavailability").insert(pieces.map((p) => ({ ...p, church_id: profile.church_id, user_id: user.id, note: existing.note })));
        }
      }
      if (e) setError("Couldn't update that day. Try again.");
    } else {
      const { error: e } = await (supabase as any)
        .from("volunteer_unavailability")
        .insert({ church_id: profile.church_id, user_id: user.id, start_date: day, end_date: day });
      if (e) setError("Couldn't update that day. Try again.");
    }
    await load();
    setBusy(null);
  };

  const remove = async (row: AwayRow) => {
    if (!supabase || busy) return;
    setBusy(row.id);
    const { error: e } = await (supabase as any).from("volunteer_unavailability").delete().eq("id", row.id);
    if (e) setError("Couldn't remove that. Try again.");
    await load();
    setBusy(null);
  };

  const clash = away.flatMap((a) => [...serving].filter((d) => d >= a.start_date && d <= a.end_date)).sort();

  return (
    <Screen>
      <AppBar onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space.gutter, paddingBottom: space.xxl }}>
        <Text style={styles.title} accessibilityRole="header">Dates you're away</Text>
        <Text style={styles.sub}>Tap a service day you can't make. Your team won't ask you to serve then.</Text>

        {loading ? <Loader /> : (
          <>
            <View style={styles.monthBar}>
              <Pressable
                onPress={() => setMonthOffset((m) => Math.max(0, m - 1))}
                disabled={monthOffset === 0}
                accessibilityRole="button"
                accessibilityLabel="Previous month"
                style={[styles.navBtn, monthOffset === 0 && { opacity: 0.35 }]}
              >
                <Icon name="chevronLeft" size={20} color={palette.ink} />
              </Pressable>
              <Text style={styles.monthLabel} accessibilityRole="header">{month.label}</Text>
              <Pressable
                onPress={() => setMonthOffset((m) => Math.min(MONTHS_AHEAD - 1, m + 1))}
                disabled={monthOffset >= MONTHS_AHEAD - 1}
                accessibilityRole="button"
                accessibilityLabel="Next month"
                style={[styles.navBtn, monthOffset >= MONTHS_AHEAD - 1 && { opacity: 0.35 }]}
              >
                <Icon name="chevronRight" size={20} color={palette.ink} />
              </Pressable>
            </View>

            <View style={styles.grid}>
              {DOW.map((d, i) => <Text key={`h${i}`} style={styles.dowHead}>{d}</Text>)}
              {month.cells.map((c, i) => {
                if (!c) return <View key={`e${i}`} style={styles.cell} />;
                const selectable = serviceDows.has(c.dow) && c.date >= today;
                const isAway = !!awayFor(c.date);
                const isServing = serving.has(c.date);
                if (!selectable) {
                  return <View key={c.date} style={styles.cell}><Text style={styles.dayOff}>{c.day}</Text></View>;
                }
                const label = `${dateParts(c.date).long}${isServing ? ", you're serving" : ""}${isAway ? ", away" : ""}`;
                return (
                  <View key={c.date} style={styles.cell}>
                    <Pressable
                      onPress={() => void toggle(c.date)}
                      disabled={busy !== null}
                      accessibilityRole="checkbox"
                      aria-checked={isAway}
                      accessibilityLabel={label}
                      style={({ pressed }: { pressed: boolean }) => [
                        styles.day,
                        isAway ? styles.dayAway : isServing ? { backgroundColor: AREA.services.tint } : styles.dayService,
                        (pressed || busy === c.date) && { opacity: 0.6 },
                      ]}
                    >
                      <Text style={[styles.dayTxt, isAway ? { color: palette.onDark } : isServing ? { color: AREA.services.ink } : null]}>{c.day}</Text>
                      {isServing && !isAway ? <View style={[styles.dot, { backgroundColor: AREA.services.ink }]} /> : null}
                    </Pressable>
                  </View>
                );
              })}
            </View>

            <View style={styles.legend}>
              <View style={styles.legendItem}><View style={[styles.swatch, { backgroundColor: AREA.services.tint }]} /><Text style={styles.legendTxt}>You're serving</Text></View>
              <View style={styles.legendItem}><View style={[styles.swatch, { backgroundColor: palette.ink }]} /><Text style={styles.legendTxt}>Away</Text></View>
              <View style={styles.legendItem}><View style={[styles.swatch, styles.dayService]} /><Text style={styles.legendTxt}>Service day</Text></View>
            </View>

            {clash.length > 0 ? (
              <View style={styles.warn} accessibilityLiveRegion="polite">
                <Icon name="alertImportant" size={18} color={palette.amberInk} />
                <Text style={styles.warnTxt}>
                  You're still on the schedule {clash.map((d) => dateParts(d).short).join(", ")}. Open it on the Serve tab and tap "I can't make it anymore" so your team can find someone.
                </Text>
              </View>
            ) : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            {away.length > 0 ? (
              <>
                <Text style={styles.section} accessibilityRole="header">Coming up</Text>
                {away.map((a) => (
                  <View key={a.id} style={styles.awayRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.awayMain}>
                        {a.start_date === a.end_date ? dateParts(a.start_date).long : `${dateParts(a.start_date).short} – ${dateParts(a.end_date).short}`}
                      </Text>
                      {a.note?.trim() ? <Text style={styles.awaySub}>{a.note.trim()}</Text> : null}
                    </View>
                    <Pressable onPress={() => void remove(a)} disabled={busy !== null} accessibilityRole="button" accessibilityLabel="Remove" style={styles.removeBtn}>
                      <Text style={styles.removeTxt}>Remove</Text>
                    </Pressable>
                  </View>
                ))}
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: font.bold, fontSize: 28, letterSpacing: -0.5, color: palette.ink, marginTop: 4 },
  sub: { fontFamily: font.regular, fontSize: 15, lineHeight: 22, color: palette.inkSoft, marginTop: 6 },
  monthBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 22 },
  navBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, alignItems: "center", justifyContent: "center" },
  monthLabel: { fontFamily: font.semibold, fontSize: 17, color: palette.ink },
  grid: { flexDirection: "row", flexWrap: "wrap", marginTop: 12 },
  dowHead: { width: `${100 / 7}%`, textAlign: "center", fontFamily: font.semibold, fontSize: 12, color: palette.inkMuted, paddingVertical: 6 },
  cell: { width: `${100 / 7}%`, padding: 2, alignItems: "center", justifyContent: "center", minHeight: 48 },
  dayOff: { fontFamily: font.regular, fontSize: 15, color: "#A8A29E" },
  day: { width: "100%", height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  dayService: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line },
  dayAway: { backgroundColor: palette.ink },
  dayTxt: { fontFamily: font.semibold, fontSize: 15, color: palette.ink },
  dot: { width: 4, height: 4, borderRadius: 2, position: "absolute", bottom: 5 },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 14 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  swatch: { width: 14, height: 14, borderRadius: 4 },
  legendTxt: { fontFamily: font.regular, fontSize: 13, color: palette.inkSoft },
  warn: { flexDirection: "row", gap: 10, backgroundColor: "#FFF8EB", borderWidth: 1, borderColor: "#F6D9A6", borderRadius: 14, padding: 14, marginTop: 20 },
  warnTxt: { flex: 1, fontFamily: font.regular, fontSize: 14, lineHeight: 20, color: "#7A4508" },
  error: { fontFamily: font.regular, fontSize: 13, color: palette.dangerInk, marginTop: 12 },
  section: { fontFamily: font.bold, fontSize: 18, color: palette.ink, marginTop: 26, marginBottom: 6 },
  awayRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.line },
  awayMain: { fontFamily: font.semibold, fontSize: 15, color: palette.ink },
  awaySub: { fontFamily: font.regular, fontSize: 14, color: palette.inkSoft, marginTop: 2 },
  removeBtn: { minHeight: 44, paddingHorizontal: 12, justifyContent: "center", borderRadius: 10, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface },
  removeTxt: { fontFamily: font.regular, fontSize: 14, color: palette.inkSoft },
});
