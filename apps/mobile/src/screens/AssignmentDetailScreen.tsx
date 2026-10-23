import { useCallback, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "../components/ui/Icon";
import { AppBar, Avatar, Loader, Screen, palette, font, radius, space } from "../components/ds";
import AnswerButtons from "../components/app/AnswerButtons";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";
import { addToCalendar, openDirections } from "../lib/events";
import { type ServeRow, addMinutes, clock, dateParts, readyBy, respondTo, serviceLine } from "../lib/serving";

type Item = { id: string; title: string | null; duration_minutes: number | null; notes: string | null; assigned_user_id: string | null; backup_user_id: string | null };
type Slot = { id: string; role_id: string; assigned_user_id: string | null; backup_user_id: string | null; status: string };
type Person = { id: string; full_name: string | null; email: string | null; avatar_url: string | null };

const nameOf = (p?: Person) => (p ? p.full_name?.trim() || p.email || "Someone" : "Someone");

/**
 * One assignment, everything needed to show up (Ticketmaster ticket / airline
 * booking detail): when, be ready by, where, your parts with their clock times,
 * who's serving with you, your backup — and the answer at the bottom.
 */
export default function AssignmentDetailScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const [row, setRow] = useState<ServeRow>(route.params.row as ServeRow);
  const [items, setItems] = useState<Item[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [people, setPeople] = useState<Record<string, Person>>({});
  const [church, setChurch] = useState<{ name: string; address: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase || !profile?.church_id) return;
    const [itemsRes, slotsRes, churchRes, peopleRes] = await Promise.all([
      supabase.from("service_plan_items").select("id, title, duration_minutes, notes, assigned_user_id, backup_user_id, assignment_status").eq("plan_id", row.planId).order("position"),
      supabase.from("service_plan_role_slots").select("id, role_id, assigned_user_id, backup_user_id, status").eq("plan_id", row.planId),
      supabase.from("churches").select("name, address").eq("id", profile.church_id).maybeSingle(),
      supabase.from("profiles").select("id, full_name, email, avatar_url").eq("church_id", profile.church_id),
    ]);
    const its = (itemsRes.data ?? []) as (Item & { assignment_status: string | null })[];
    const sls = (slotsRes.data ?? []) as Slot[];
    setItems(its);
    setSlots(sls);
    setChurch((churchRes.data as { name: string; address: string | null } | null) ?? null);
    const map: Record<string, Person> = {};
    for (const p of (peopleRes.data ?? []) as Person[]) map[p.id] = p;
    setPeople(map);
    // The answer may have changed since the list was loaded (backup promoted, admin edit).
    const fresh = row.source === "bulletin_role" ? sls.find((s) => s.id === row.id)?.status : its.find((i) => i.id === row.id)?.assignment_status;
    if (fresh) setRow((r) => ({ ...r, status: fresh }));
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row.planId, row.id, profile?.church_id]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const me = user?.id ?? "";
  const p = dateParts(row.date);
  const ready = readyBy(row.startTime);

  // Clock time for each step: service start + the steps before it.
  const timed = (() => {
    let offset = 0;
    return items.map((i) => {
      const at = row.startTime ? clock(addMinutes(row.startTime, offset)) : null;
      offset += i.duration_minutes ?? 0;
      return { ...i, at };
    });
  })();
  const totalMinutes = items.reduce((s, i) => s + (i.duration_minutes ?? 0), 0);
  const endLine = row.startTime && totalMinutes ? `${clock(row.startTime)} – ${clock(addMinutes(row.startTime, totalMinutes))}` : row.startTime ? `Starts ${clock(row.startTime)}` : null;
  const myParts = timed.filter((i) => i.assigned_user_id === me || i.backup_user_id === me);

  const thisRow = row.source === "bulletin_role" ? slots.find((s) => s.id === row.id) : items.find((i) => i.id === row.id);
  const partnerId = row.isBackup ? thisRow?.assigned_user_id : thisRow?.backup_user_id;
  const teamIds = [...new Set([...slots, ...items].map((r) => r.assigned_user_id).filter((id): id is string => !!id && id !== me))];

  const answer = async (response: "CONFIRMED" | "DECLINED") => {
    if (!supabase || saving) return;
    setSaving(true); setError(null);
    const res = await respondTo(supabase, row, response);
    setSaving(false);
    if (res.error) { setError(res.error); return; }
    if (response === "CONFIRMED") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (response === "DECLINED" && (res.promoted || row.isBackup)) { navigation.goBack(); return; }
    setRow((r) => ({ ...r, status: response }));
  };

  const confirmDecline = () => {
    const title = row.isBackup ? "Step down as backup?" : "Can't make it?";
    const body = row.isBackup
      ? `You won't be on call for ${row.title} on ${p.long}.`
      : `You'll be taken off ${row.title} on ${p.long}. ${partnerId ? `${nameOf(people[partnerId]).split(" ")[0]} (your backup) steps in.` : "Your team will see the gap and find someone."}`;
    // react-native-web's Alert is a no-op — the browser preview needs a real prompt.
    if (Platform.OS === "web") {
      if (window.confirm(`${title}\n\n${body}`)) void answer("DECLINED");
      return;
    }
    Alert.alert(title, body, [
      { text: "Keep me on", style: "cancel" },
      {
        text: row.isBackup ? "Step down" : "I can't make it",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          void answer("DECLINED");
        },
      },
    ]);
  };

  const calendar = async () => {
    if (!row.startTime) return;
    const start = new Date(`${row.date}T${row.startTime.slice(0, 5)}:00`);
    const end = new Date(start.getTime() + (totalMinutes || 90) * 60_000);
    try {
      await addToCalendar(
        { id: row.key, title: `Serving: ${row.title}`, description: ready ? `Be ready by ${ready}.` : null, location: row.serviceName, start_at: start.toISOString(), end_at: end.toISOString() },
        church?.address ?? null
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't open your calendar.");
    }
  };

  const status = row.isBackup
    ? { label: "You're the backup", bg: palette.sunken, fg: palette.inkSoft, icon: "info" as const }
    : row.status === "CONFIRMED"
      ? { label: "You're going", bg: palette.successSoft, fg: palette.successInk, icon: "checkCircle" as const }
      : row.status === "DECLINED"
        ? { label: "You said you can't make it", bg: palette.dangerSoft, fg: palette.dangerInk, icon: "alertImportant" as const }
        : { label: "Waiting for your answer", bg: "#FFF8EB", fg: palette.amberInk, icon: "clock" as const };

  return (
    <Screen edges={["top"]}>
      <AppBar onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space.gutter, paddingBottom: 24 }}>
        <View style={[styles.status, { backgroundColor: status.bg }]}>
          <Icon name={status.icon} size={14} color={status.fg} />
          <Text style={[styles.statusTxt, { color: status.fg }]}>{status.label}</Text>
        </View>
        <Text style={styles.title} accessibilityRole="header">{row.isBackup ? `Backup · ${row.title}` : row.title}</Text>
        <Text style={styles.sub}>{serviceLine(row)}</Text>

        <View style={styles.box}>
          <View style={styles.infoRow}>
            <Icon name="calendar" size={20} color={palette.inkSoft} />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoMain}>{p.long}</Text>
              {endLine ? <Text style={styles.infoSub}>Service {endLine}</Text> : null}
            </View>
            {row.startTime ? (
              <Pressable onPress={() => void calendar()} hitSlop={8} accessibilityRole="button" style={styles.inlineBtn}>
                <Text style={styles.link}>Add to calendar</Text>
              </Pressable>
            ) : null}
          </View>
          {ready ? (
            <>
              <View style={styles.rule} />
              <View style={styles.infoRow}>
                <Icon name="clock" size={20} color={palette.inkSoft} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoMain}>Be ready by {ready}</Text>
                  <Text style={styles.infoSub}>Check in on the app when you arrive</Text>
                </View>
              </View>
            </>
          ) : null}
          {church?.address ? (
            <>
              <View style={styles.rule} />
              <View style={styles.infoRow}>
                <Icon name="mapPin" size={20} color={palette.inkSoft} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoMain}>{church.name}</Text>
                  <Text style={styles.infoSub}>{church.address}</Text>
                </View>
                <Pressable onPress={() => void openDirections(church.address!, church.name)} hitSlop={8} accessibilityRole="button" style={styles.inlineBtn}>
                  <Text style={styles.link}>Directions</Text>
                </Pressable>
              </View>
            </>
          ) : null}
        </View>

        {loading ? <Loader style={{ marginTop: 24 }} /> : (
          <>
            {myParts.length > 0 ? (
              <>
                <Text style={styles.section} accessibilityRole="header">Your parts</Text>
                <View style={[styles.box, { marginTop: 0, paddingVertical: 4 }]}>
                  {myParts.map((i) => (
                    <View key={i.id} style={styles.partRow}>
                      <Text style={styles.partTime}>{i.at ?? "—"}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.infoMain}>{i.title || "Part of the service"}</Text>
                        <Text style={styles.infoSub}>{[i.duration_minutes ? `${i.duration_minutes} min` : null, i.backup_user_id === me && i.assigned_user_id !== me ? "as backup" : null, i.notes?.trim() || null].filter(Boolean).join(" · ")}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            ) : null}
            <Pressable
              onPress={() => navigation.navigate("MainTabs", { screen: "ServicePlan", params: { planId: row.planId } })}
              accessibilityRole="link"
              style={styles.planLink}
            >
              <Text style={styles.link}>See the whole order of service</Text>
            </Pressable>

            {teamIds.length > 0 ? (
              <>
                <Text style={styles.section} accessibilityRole="header">Serving with you</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                  {teamIds.slice(0, 12).map((id) => (
                    <View key={id} style={styles.person}>
                      <Avatar name={nameOf(people[id])} email={people[id]?.email} imageUri={people[id]?.avatar_url} size={44} />
                      <Text style={styles.personName} numberOfLines={1}>{nameOf(people[id]).split(" ")[0]}</Text>
                    </View>
                  ))}
                </ScrollView>
              </>
            ) : null}
            {partnerId ? (
              <Text style={styles.backupLine}>
                {row.isBackup ? "Serving: " : "Your backup: "}
                <Text style={{ fontFamily: font.semibold, color: palette.ink }}>{nameOf(people[partnerId])}</Text>
                {row.isBackup ? ". You step in if they can't make it." : " steps in if you can't make it."}
              </Text>
            ) : null}
          </>
        )}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        {!row.isBackup && row.status !== "CONFIRMED" && row.status !== "DECLINED" ? (
          <AnswerButtons busy={saving} onYes={() => void answer("CONFIRMED")} onNo={() => void answer("DECLINED")} />
        ) : row.status === "DECLINED" && !row.isBackup ? (
          <Pressable onPress={() => void answer("CONFIRMED")} disabled={saving} accessibilityRole="button" style={({ pressed }: { pressed: boolean }) => [styles.footerBtn, styles.footerYes, (pressed || saving) && { opacity: 0.8 }]}>
            <Text style={styles.footerYesTxt}>I can make it after all</Text>
          </Pressable>
        ) : (
          <Pressable onPress={confirmDecline} disabled={saving} accessibilityRole="button" style={({ pressed }: { pressed: boolean }) => [styles.footerBtn, (pressed || saving) && { opacity: 0.8 }]}>
            <Text style={styles.footerNoTxt}>{row.isBackup ? "Step down as backup" : "I can't make it anymore"}</Text>
          </Pressable>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  status: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginTop: 4 },
  statusTxt: { fontFamily: font.semibold, fontSize: 13 },
  title: { fontFamily: font.bold, fontSize: 28, lineHeight: 34, letterSpacing: -0.5, color: palette.ink, marginTop: 12 },
  sub: { fontFamily: font.regular, fontSize: 15, color: palette.inkSoft, marginTop: 4 },
  box: { marginTop: 18, borderWidth: 1, borderColor: palette.line, borderRadius: 16, backgroundColor: palette.surface },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, paddingHorizontal: 16 },
  infoMain: { fontFamily: font.semibold, fontSize: 15, color: palette.ink },
  infoSub: { fontFamily: font.regular, fontSize: 14, color: palette.inkSoft, marginTop: 2 },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: palette.line, marginLeft: 50 },
  inlineBtn: { minHeight: 44, justifyContent: "center" },
  link: { fontFamily: font.semibold, fontSize: 14, color: palette.amberInk },
  section: { fontFamily: font.bold, fontSize: 18, color: palette.ink, marginTop: 26, marginBottom: 10 },
  partRow: { flexDirection: "row", gap: 12, paddingVertical: 12, paddingHorizontal: 16 },
  partTime: { width: 64, fontFamily: font.semibold, fontSize: 14, color: palette.amberInk, fontVariant: ["tabular-nums"] },
  planLink: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start", marginTop: 4 },
  person: { width: 60, alignItems: "center" },
  personName: { fontFamily: font.regular, fontSize: 12, color: palette.ink, marginTop: 6 },
  backupLine: { fontFamily: font.regular, fontSize: 14, lineHeight: 20, color: palette.inkSoft, marginTop: 14 },
  error: { fontFamily: font.regular, fontSize: 13, color: palette.dangerInk, marginTop: 14 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.line, backgroundColor: palette.surface, paddingHorizontal: space.gutter, paddingTop: 12 },
  footerBtn: { minHeight: 48, borderRadius: radius.md, borderWidth: 1, borderColor: palette.line, alignItems: "center", justifyContent: "center", backgroundColor: palette.surface },
  footerYes: { backgroundColor: palette.amber, borderColor: palette.amber },
  footerYesTxt: { fontFamily: font.semibold, fontSize: 15, color: "#3A2600" },
  footerNoTxt: { fontFamily: font.semibold, fontSize: 15, color: palette.dangerInk },
});
