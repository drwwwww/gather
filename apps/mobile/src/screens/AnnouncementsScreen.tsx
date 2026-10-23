import { useCallback, useMemo, useState } from "react";
import { View, Text, Image, ScrollView, Pressable, RefreshControl, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "@react-navigation/native";
import { Icon } from "../components/ui/Icon";
import { Screen, EmptyState, Loader, palette, font, radius, shadow, space } from "../components/ds";
import { newsFallback } from "../lib/churchImagery";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";
import { eventWhen } from "../lib/events";
import {
  ANNOUNCEMENT_COLUMNS, KIND_META, type AnnouncementRow, type Extras, closesLabel, isClosed, loadExtras, normalize,
  relativeLabel, setPraying, setRsvp, slotTotals,
} from "../lib/announcements";

type Filter = "ALL" | "NEEDS" | "EVENT" | "SIGNUP" | "PRAYER";

const emptyExtras: Extras = { events: {}, going: {}, maybe: {}, myRsvp: {}, slots: {}, praying: {}, iPray: new Set() };
const oneLine = (s: string) => s.replace(/\s+/g, " ").trim();

/**
 * News (Church Center / ParentSquare): filter chips, the important or pinned
 * post on top, and each post's action on its card — "I'm going", "Pick a
 * slot", "Praying" — so most things never need a second tap.
 */
export default function AnnouncementsScreen({ navigation }: any) {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<AnnouncementRow[]>([]);
  const [extras, setExtras] = useState<Extras>(emptyExtras);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase || !user?.id || !profile?.church_id) {
      setItems([]); setLoading(false); setRefreshing(false);
      return;
    }
    const { data, error: e } = await supabase
      .from("announcements")
      .select(ANNOUNCEMENT_COLUMNS)
      .eq("church_id", profile.church_id)
      .not("publish_at", "is", null)
      .lte("publish_at", new Date().toISOString())
      .order("publish_at", { ascending: false })
      .limit(50);
    if (!e) {
      const rows = (data ?? []).map(normalize);
      setItems(rows);
      setExtras(await loadExtras(supabase, rows, user.id));
    }
    setLoading(false); setRefreshing(false);
  }, [user?.id, profile?.church_id]);

  useFocusEffect(useCallback(() => { setLoading(true); void load(); }, [load]));

  const me = user?.id ?? "";
  // "Needs you": an event you haven't answered, or a sign-up you haven't joined that's still open.
  const needsYou = useCallback((a: AnnouncementRow) => {
    if (a.kind === "EVENT" && a.event_id) {
      const ev = extras.events[a.event_id];
      return !!ev && !ev.is_cancelled && new Date(ev.start_at) > new Date() && !extras.myRsvp[a.event_id];
    }
    if (a.kind === "SIGNUP") {
      const t = slotTotals(extras.slots[a.id], me);
      return !isClosed(a) && !t.mine && t.taken < t.capacity;
    }
    return false;
  }, [extras, me]);

  const highlighted = items.find((a) => a.important || a.pinned) ?? null;
  const visible = useMemo(() => {
    const list = items.filter((a) => a.id !== highlighted?.id || filter !== "ALL");
    if (filter === "ALL") return list;
    if (filter === "NEEDS") return list.filter(needsYou);
    return list.filter((a) => a.kind === filter);
  }, [items, filter, highlighted, needsYou]);
  const needsCount = items.filter(needsYou).length;

  const open = (a: AnnouncementRow) =>
    navigation.navigate("AnnouncementsDetail", { announcement: { id: a.id, title: a.title, body: a.body, publish_at: a.publish_at, image_url: a.image_url } });

  const going = async (a: AnnouncementRow) => {
    if (!supabase || !a.event_id || busy) return;
    setBusy(a.id); setError(null);
    const was = extras.myRsvp[a.event_id];
    const next = was === "GOING" ? "NO" : "GOING";
    const err = await setRsvp(supabase, a.event_id, me, next);
    setBusy(null);
    if (err) { setError(err); return; }
    Haptics.selectionAsync().catch(() => {});
    setExtras((x) => ({
      ...x,
      myRsvp: { ...x.myRsvp, [a.event_id!]: next },
      going: { ...x.going, [a.event_id!]: (x.going[a.event_id!] ?? 0) + (next === "GOING" ? 1 : was === "GOING" ? -1 : 0) },
    }));
  };

  const pray = async (a: AnnouncementRow) => {
    if (!supabase || !profile?.church_id || busy) return;
    const on = !extras.iPray.has(a.id);
    setBusy(a.id); setError(null);
    const err = await setPraying(supabase, a.id, profile.church_id, me, on);
    setBusy(null);
    if (err) { setError(err); return; }
    Haptics.selectionAsync().catch(() => {});
    setExtras((x) => {
      const iPray = new Set(x.iPray);
      if (on) iPray.add(a.id); else iPray.delete(a.id);
      return { ...x, iPray, praying: { ...x.praying, [a.id]: Math.max(0, (x.praying[a.id] ?? 0) + (on ? 1 : -1)) } };
    });
  };

  const chips: { key: Filter; label: string }[] = [
    { key: "ALL", label: "All" },
    ...(needsCount ? [{ key: "NEEDS" as const, label: `Needs you · ${needsCount}` }] : []),
    ...(items.some((a) => a.kind === "EVENT") ? [{ key: "EVENT" as const, label: "Events" }] : []),
    ...(items.some((a) => a.kind === "SIGNUP") ? [{ key: "SIGNUP" as const, label: "Sign-ups" }] : []),
    ...(items.some((a) => a.kind === "PRAYER") ? [{ key: "PRAYER" as const, label: "Prayer" }] : []),
  ];

  const Tag = ({ a }: { a: AnnouncementRow }) => {
    const meta = KIND_META[a.kind];
    const closes = a.kind === "SIGNUP" ? closesLabel(a.closes_at) : null;
    return (
      <View style={styles.tagRow}>
        <View style={[styles.tag, { backgroundColor: meta.area.tint }]}><Text style={[styles.tagTxt, { color: meta.area.ink }]}>{meta.label}</Text></View>
        <Text style={[styles.when, closes && closes !== "Closed" ? { color: palette.amberInk, fontFamily: font.semibold } : null]}>
          {closes ?? relativeLabel(a.publish_at, a.created_at)}
        </Text>
      </View>
    );
  };

  const card = (a: AnnouncementRow) => {
    const ev = a.event_id ? extras.events[a.event_id] : undefined;
    if (a.kind === "EVENT" && ev) {
      const w = eventWhen(ev, true);
      const isGoing = extras.myRsvp[ev.id] === "GOING";
      return (
        <Pressable key={a.id} onPress={() => open(a)} accessibilityRole="button" style={({ pressed }: { pressed: boolean }) => [styles.card, pressed && styles.pressed]}>
          <Image source={a.image_url ? { uri: a.image_url } : newsFallback(a.id)} style={styles.cardImg} resizeMode="cover" accessibilityIgnoresInvertColors />
          <View style={styles.cardBody}>
            <Tag a={a} />
            <Text style={styles.cardTitle}>{a.title}</Text>
            <Text style={styles.cardMeta}>{ev.is_cancelled ? "Cancelled" : [w.dateLine, w.timeLine, ev.location].filter(Boolean).join(" · ")}</Text>
            {!ev.is_cancelled && new Date(ev.start_at) > new Date() ? (
              <View style={styles.actionRow}>
                <Pressable onPress={() => void going(a)} disabled={busy === a.id} accessibilityRole="button" style={({ pressed }: { pressed: boolean }) => [isGoing ? styles.btnQuiet : styles.btnAmber, (pressed || busy === a.id) && { opacity: 0.8 }]}>
                  {isGoing ? <Icon name="check" size={16} color={palette.successInk} /> : null}
                  <Text style={isGoing ? styles.btnQuietTxt : styles.btnAmberTxt}>{isGoing ? "Going" : "I'm going"}</Text>
                </Pressable>
                <Text style={styles.cardMeta}>{extras.going[ev.id] ?? 0} going</Text>
              </View>
            ) : null}
          </View>
        </Pressable>
      );
    }
    if (a.kind === "SIGNUP") {
      const t = slotTotals(extras.slots[a.id], me);
      const pct = t.capacity ? Math.round((t.taken / t.capacity) * 100) : 0;
      return (
        <Pressable key={a.id} onPress={() => open(a)} accessibilityRole="button" style={({ pressed }: { pressed: boolean }) => [styles.card, styles.cardBody, pressed && styles.pressed]}>
          <Tag a={a} />
          <Text style={styles.cardTitle}>{a.title}</Text>
          {a.body ? <Text style={styles.cardText} numberOfLines={2}>{oneLine(a.body)}</Text> : null}
          <View style={styles.progress} accessibilityLabel={`${t.taken} of ${t.capacity} taken`}><View style={[styles.progressFill, { width: `${pct}%` }]} /></View>
          <View style={styles.actionRow}>
            <Text style={[styles.cardMeta, { flex: 1 }]}>
              {t.mine ? <Text style={{ color: palette.successInk, fontFamily: font.semibold }}>You: {t.mine.label}</Text> : <><Text style={{ color: palette.ink, fontFamily: font.semibold }}>{t.taken} of {t.capacity}</Text> taken</>}
            </Text>
            {!t.mine && !isClosed(a) && t.taken < t.capacity ? (
              <View style={styles.btnDark}><Text style={styles.btnDarkTxt}>Pick a slot</Text></View>
            ) : null}
          </View>
        </Pressable>
      );
    }
    if (a.kind === "PRAYER") {
      const on = extras.iPray.has(a.id);
      return (
        <Pressable key={a.id} onPress={() => open(a)} accessibilityRole="button" style={({ pressed }: { pressed: boolean }) => [styles.card, styles.cardBody, pressed && styles.pressed]}>
          <Tag a={a} />
          <Text style={styles.cardTitle}>{a.title}</Text>
          {a.body ? <Text style={styles.cardText} numberOfLines={3}>{oneLine(a.body)}</Text> : null}
          <View style={styles.actionRow}>
            <Pressable
              onPress={() => void pray(a)}
              disabled={busy === a.id}
              accessibilityRole="button"
              aria-pressed={on}
              accessibilityLabel={on ? "Praying. Tap to undo" : "I'm praying"}
              style={({ pressed }: { pressed: boolean }) => [styles.pill, on && { backgroundColor: KIND_META.PRAYER.area.tint, borderColor: KIND_META.PRAYER.area.tint }, (pressed || busy === a.id) && { opacity: 0.8 }]}
            >
              <Icon name="pray" size={16} color={KIND_META.PRAYER.area.ink} />
              <Text style={[styles.pillTxt, on && { color: KIND_META.PRAYER.area.ink }]}>{on ? "Praying" : "I'm praying"} · {extras.praying[a.id] ?? 0}</Text>
            </Pressable>
          </View>
        </Pressable>
      );
    }
    return (
      <Pressable key={a.id} onPress={() => open(a)} accessibilityRole="button" style={({ pressed }: { pressed: boolean }) => [styles.card, styles.rowCard, pressed && styles.pressed]}>
        <Image source={a.image_url ? { uri: a.image_url } : newsFallback(a.id)} style={styles.thumb} resizeMode="cover" accessibilityIgnoresInvertColors />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.when, { color: KIND_META.UPDATE.area.ink, fontFamily: font.semibold }]}>Update · {relativeLabel(a.publish_at, a.created_at)}</Text>
          <Text style={styles.rowTitle} numberOfLines={2}>{a.title}</Text>
          {a.body ? <Text style={styles.cardMeta} numberOfLines={1}>{oneLine(a.body)}</Text> : null}
        </View>
      </Pressable>
    );
  };

  return (
    <Screen>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: space.base, paddingTop: 8, paddingBottom: space.xxl }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={palette.amber} />}
      >
        <Text style={styles.title} accessibilityRole="header">News</Text>

        {chips.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -space.base, marginBottom: 14 }} contentContainerStyle={{ gap: 8, paddingHorizontal: space.base }} accessibilityRole="tablist">
            {chips.map((c) => {
              const active = filter === c.key;
              return (
                <Pressable key={c.key} onPress={() => setFilter(c.key)} accessibilityRole="tab" aria-selected={active} style={[styles.chip, active && styles.chipActive]}>
                  <Text style={[styles.chipTxt, active && { color: palette.onDark }]}>{c.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {loading ? (
          <Loader />
        ) : items.length === 0 ? (
          <EmptyState icon="announcements" title="No news yet" body="When your church posts updates, they'll appear here." />
        ) : (
          <View style={{ gap: 14 }}>
            {filter === "ALL" && highlighted ? (
              <Pressable
                onPress={() => open(highlighted)}
                accessibilityRole="button"
                style={({ pressed }: { pressed: boolean }) => [styles.important, !highlighted.important && styles.pinned, pressed && styles.pressed]}
              >
                <Icon name={highlighted.important ? "alertImportant" : "pin"} size={20} color={highlighted.important ? palette.amberInk : palette.inkSoft} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.importantEyebrow, !highlighted.important && { color: palette.inkSoft }]}>{highlighted.important ? "Important" : "Pinned"} · {KIND_META[highlighted.kind].label}</Text>
                  <Text style={styles.importantTitle}>{highlighted.title}</Text>
                  {highlighted.body ? <Text style={styles.cardText} numberOfLines={2}>{oneLine(highlighted.body)}</Text> : null}
                </View>
              </Pressable>
            ) : null}
            {visible.map(card)}
            {visible.length === 0 ? <Text style={[styles.cardMeta, { textAlign: "center", marginTop: 24 }]}>Nothing here right now.</Text> : null}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const surface = { backgroundColor: palette.surface, borderRadius: 18, ...shadow.sm } as const;

const styles = StyleSheet.create({
  title: { fontFamily: font.bold, fontSize: 28, letterSpacing: -0.5, color: palette.ink, paddingHorizontal: 4, paddingTop: 8, marginBottom: 12 },
  chip: { minHeight: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, justifyContent: "center" },
  chipActive: { backgroundColor: palette.ink, borderColor: palette.ink },
  chipTxt: { fontFamily: font.medium, fontSize: 14, color: palette.inkSoft },
  error: { fontFamily: font.regular, fontSize: 13, color: palette.dangerInk, marginBottom: 10, marginHorizontal: 4 },

  important: { flexDirection: "row", gap: 12, backgroundColor: "#FFF8EB", borderWidth: 1, borderColor: "#F6D9A6", borderRadius: 16, padding: 16 },
  pinned: { backgroundColor: palette.surface, borderColor: palette.line },
  importantEyebrow: { fontFamily: font.semibold, fontSize: 12, color: palette.amberInk },
  importantTitle: { fontFamily: font.semibold, fontSize: 16, color: palette.ink, marginTop: 2 },

  card: { ...surface, overflow: "hidden" },
  pressed: { opacity: 0.92 },
  cardImg: { width: "100%", height: 150, backgroundColor: palette.sunken },
  cardBody: { padding: 16 },
  tagRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  tag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  tagTxt: { fontFamily: font.semibold, fontSize: 12 },
  when: { fontFamily: font.regular, fontSize: 13, color: palette.inkMuted },
  cardTitle: { fontFamily: font.semibold, fontSize: 18, color: palette.ink, marginTop: 8 },
  cardText: { fontFamily: font.regular, fontSize: 14, lineHeight: 20, color: palette.inkSoft, marginTop: 4 },
  cardMeta: { fontFamily: font.regular, fontSize: 14, color: palette.inkSoft, marginTop: 4 },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 },
  btnAmber: { minHeight: 44, paddingHorizontal: 16, borderRadius: 12, backgroundColor: palette.amber, flexDirection: "row", alignItems: "center", gap: 6 },
  btnAmberTxt: { fontFamily: font.semibold, fontSize: 15, color: "#3A2600" },
  btnQuiet: { minHeight: 44, paddingHorizontal: 14, borderRadius: 12, backgroundColor: palette.successSoft, flexDirection: "row", alignItems: "center", gap: 6 },
  btnQuietTxt: { fontFamily: font.semibold, fontSize: 15, color: palette.successInk },
  btnDark: { minHeight: 40, paddingHorizontal: 16, borderRadius: 12, backgroundColor: palette.ink, justifyContent: "center" },
  btnDarkTxt: { fontFamily: font.semibold, fontSize: 15, color: palette.onDark },
  progress: { height: 6, borderRadius: 3, backgroundColor: palette.lineSoft, marginTop: 12, overflow: "hidden" },
  progressFill: { height: 6, backgroundColor: "#009B90" },
  pill: { minHeight: 40, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: palette.line, flexDirection: "row", alignItems: "center", gap: 6 },
  pillTxt: { fontFamily: font.medium, fontSize: 14, color: palette.ink },
  rowCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  thumb: { width: 56, height: 56, borderRadius: radius.chip, backgroundColor: palette.sunken },
  rowTitle: { fontFamily: font.semibold, fontSize: 16, color: palette.ink, marginTop: 2 },
});
