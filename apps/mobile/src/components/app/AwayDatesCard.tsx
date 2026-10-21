import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { Icon } from "../ui/Icon";
import { palette, font, radius, shadow } from "../ds";
import { supabase } from "../../supabase";

type AwayRow = { id: string; start_date: string; end_date: string };

const WEEKS_AHEAD = 10;
const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/**
 * "Can't make it?" — volunteers tap the service days they'll be away.
 * Admins see it when scheduling and Gather AI skips them.
 */
export default function AwayDatesCard({
  churchId,
  userId,
  scheduledDates,
}: {
  churchId: string;
  userId: string;
  /** Dates the volunteer is already scheduled — marking one away needs a decline too. */
  scheduledDates: Set<string>;
}) {
  const [days, setDays] = useState<string[]>([]);
  const [away, setAway] = useState<AwayRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    const today = ymd(new Date());
    const [{ data: times }, { data: mine }] = await Promise.all([
      supabase.from("service_times").select("day_of_week").eq("church_id", churchId),
      (supabase as any)
        .from("volunteer_unavailability")
        .select("id, start_date, end_date")
        .eq("user_id", userId)
        .gte("end_date", today),
    ]);
    const dows = new Set(((times ?? []) as { day_of_week: number }[]).map((t) => t.day_of_week));
    const list: string[] = [];
    const d = new Date();
    for (let i = 0; i < WEEKS_AHEAD * 7; i++) {
      if (dows.has(d.getDay())) list.push(ymd(d));
      d.setDate(d.getDate() + 1);
    }
    setDays(list);
    setAway((mine ?? []) as AwayRow[]);
  }, [churchId, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const awayRowFor = (day: string) => away.find((a) => a.start_date <= day && a.end_date >= day);

  const toggle = async (day: string) => {
    if (!supabase || busy) return;
    setBusy(day);
    setError(null);
    const existing = awayRowFor(day);
    if (existing) {
      const { error: e } = await (supabase as any).from("volunteer_unavailability").delete().eq("id", existing.id);
      if (e) setError("Couldn't update that day. Try again.");
      else setAway((list) => list.filter((a) => a.id !== existing.id));
    } else {
      const { data, error: e } = await (supabase as any)
        .from("volunteer_unavailability")
        .insert({ church_id: churchId, user_id: userId, start_date: day, end_date: day })
        .select("id, start_date, end_date")
        .single();
      if (e) setError("Couldn't update that day. Try again.");
      else setAway((list) => [...list, data as AwayRow]);
    }
    setBusy(null);
  };

  if (days.length === 0) return null;
  const awayScheduled = days.filter((d) => awayRowFor(d) && scheduledDates.has(d));

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Icon name="calendar" size={18} color={palette.inkSoft} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Can't make it?</Text>
          <Text style={styles.body}>Tap the days you'll be away so you aren't scheduled.</Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {days.map((day) => {
          const isAway = !!awayRowFor(day);
          const date = new Date(`${day}T12:00:00`);
          return (
            <Pressable
              key={day}
              onPress={() => void toggle(day)}
              disabled={busy !== null}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isAway }}
              aria-checked={isAway}
              accessibilityLabel={`${date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}${isAway ? ", away" : ""}`}
              style={({ pressed }: { pressed: boolean }) => [styles.chip, isAway && styles.chipAway, { opacity: busy === day ? 0.5 : pressed ? 0.85 : 1 }]}
            >
              <Text style={[styles.chipDow, isAway && styles.chipTxtAway]} maxFontSizeMultiplier={1.3}>
                {date.toLocaleDateString("en-US", { weekday: "short" })}
              </Text>
              <Text style={[styles.chipDay, isAway && styles.chipTxtAway]} maxFontSizeMultiplier={1.3}>{date.getDate()}</Text>
              <Text style={[styles.chipMon, isAway && styles.chipTxtAway]} maxFontSizeMultiplier={1.3}>
                {isAway ? "Away" : date.toLocaleDateString("en-US", { month: "short" })}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {awayScheduled.length > 0 ? (
        <Text style={styles.warn}>You're already scheduled on a day you're away — decline it below so your team can find someone.</Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: palette.surface, borderRadius: radius.xl, paddingVertical: 16, marginBottom: 24, ...shadow.sm },
  head: { flexDirection: "row", gap: 12, paddingHorizontal: 18, alignItems: "flex-start" },
  title: { fontFamily: font.bold, fontSize: 15, color: palette.ink },
  body: { fontFamily: font.regular, fontSize: 13, color: palette.inkSoft, marginTop: 2, lineHeight: 18 },
  row: { gap: 8, paddingHorizontal: 18, paddingTop: 14 },
  chip: {
    minWidth: 56,
    paddingHorizontal: 6,
    minHeight: 72,
    borderRadius: radius.md,
    backgroundColor: palette.sunken,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  chipAway: { backgroundColor: palette.ink },
  chipDow: { fontFamily: font.medium, fontSize: 11, color: palette.inkSoft },
  chipDay: { fontFamily: font.bold, fontSize: 20, color: palette.ink, marginVertical: 1 },
  chipMon: { fontFamily: font.medium, fontSize: 11, color: palette.inkSoft },
  chipTxtAway: { color: palette.onDark },
  warn: { fontFamily: font.regular, fontSize: 12, lineHeight: 17, color: palette.amberInk, paddingHorizontal: 18, marginTop: 12 },
  error: { fontFamily: font.regular, fontSize: 12, color: palette.danger, paddingHorizontal: 18, marginTop: 8 },
});
