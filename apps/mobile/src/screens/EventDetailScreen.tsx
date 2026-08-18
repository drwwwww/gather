import { useCallback, useMemo, useState } from "react";
import { View, Text, Image, ScrollView, Pressable, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Icon } from "../components/ui/Icon";
import {
  Screen, AppBar, Txt, Card, Pill, Eyebrow, Loader, StatGrid,
  palette, font, radius, shadow, space, type,
} from "../components/ds";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";

type RsvpStatus = "GOING" | "MAYBE" | "NO";
type EventRow = {
  id: string; title: string; description: string | null; location: string | null;
  start_at: string; end_at: string | null; is_cancelled: boolean; image_url: string | null;
};

const RSVP_OPTIONS: { key: RsvpStatus; label: string; icon: any }[] = [
  { key: "GOING", label: "Going", icon: "checkCircle" },
  { key: "MAYBE", label: "Maybe", icon: "calendar" },
  { key: "NO", label: "Can't go", icon: "close" },
];

export default function EventDetailScreen({ navigation, route }: any) {
  const eventId = route.params?.eventId as string | undefined;
  const { user } = useAuth();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [status, setStatus] = useState<RsvpStatus | null>(null);
  const [rsvpCounts, setRsvpCounts] = useState<{ going: number; maybe: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const client = supabase;
    if (!client || !user?.id || !eventId) { setEvent(null); setLoading(false); return; }
    setLoading(true); setError(null);
    const { data: ev, error: evErr } = await client
      .from("events")
      .select("id, title, description, location, start_at, end_at, is_cancelled, image_url")
      .eq("id", eventId)
      .maybeSingle();
    if (evErr || !ev) { setEvent(null); setLoading(false); return; }
    setEvent(ev as EventRow);
    const [rsvpRes, goingRes, maybeRes] = await Promise.all([
      client.from("event_rsvps").select("status").eq("event_id", eventId).eq("user_id", user.id).maybeSingle(),
      (client.from("event_rsvps") as any).select("*", { count: "exact", head: true }).eq("event_id", eventId).eq("status", "GOING"),
      (client.from("event_rsvps") as any).select("*", { count: "exact", head: true }).eq("event_id", eventId).eq("status", "MAYBE"),
    ]);
    setStatus(((rsvpRes.data as any)?.status as RsvpStatus) ?? null);
    setRsvpCounts({ going: goingRes.count ?? 0, maybe: maybeRes.count ?? 0 });
    setLoading(false);
  }, [eventId, user?.id]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const handleRsvp = async (nextStatus: RsvpStatus) => {
    if (!supabase || !user?.id || !eventId) return;
    setSaving(true); setError(null);
    const { error: upsertError } = await supabase.from("event_rsvps").upsert(
      { event_id: eventId, user_id: user.id, status: nextStatus },
      { onConflict: "event_id,user_id" }
    );
    if (upsertError) { setError(upsertError.message); setSaving(false); return; }
    setStatus(nextStatus); setSaving(false);
  };

  const parts = useMemo(() => {
    if (!event) return { dateStr: "", timeStr: "" };
    try {
      const start = new Date(event.start_at);
      const dateStr = start.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
      const startTime = start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
      const timeStr = event.end_at
        ? `${startTime}–${new Date(event.end_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`
        : startTime;
      return { dateStr, timeStr };
    } catch { return { dateStr: event.start_at, timeStr: "" }; }
  }, [event]);

  if (loading) {
    return <Screen><AppBar onBack={() => navigation.goBack()} /><Loader /></Screen>;
  }
  if (!eventId || !event) {
    return (
      <Screen>
        <AppBar onBack={() => navigation.goBack()} />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 }}>
          <Txt variant="body" color="inkMuted">This event could not be loaded.</Txt>
        </View>
      </Screen>
    );
  }

  const stats: { icon: any; label: string; value: string }[] = [
    { icon: "calendar", label: "Date", value: parts.dateStr.replace(/^\w+, /, "") },
    { icon: "clock", label: "Time", value: parts.timeStr || "—" },
  ];
  if (rsvpCounts && rsvpCounts.going > 0) stats.push({ icon: "checkCircle", label: "Going", value: String(rsvpCounts.going) });
  else if (event.location?.trim()) stats.push({ icon: "mapPin", label: "Where", value: event.location });

  return (
    <Screen>
      <AppBar onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {event.image_url ? (
          <Image source={{ uri: event.image_url }} style={styles.hero} resizeMode="cover" />
        ) : null}
        <View style={{ paddingHorizontal: space.gutter, paddingTop: event.image_url ? 18 : 8 }}>
          {event.is_cancelled ? <View style={{ marginBottom: 12 }}><Pill label="Cancelled" tone="danger" /></View> : null}
          <Eyebrow>Event</Eyebrow>
          <Text style={styles.title}>{event.title}</Text>
        {event.location?.trim() ? (
          <View style={styles.locRow}>
            <Icon name="mapPin" size={15} color={palette.amber} />
            <Text style={styles.locTxt}>{event.location}</Text>
          </View>
        ) : null}

        {/* Stat card */}
        <Card elevation="md" style={{ paddingVertical: 6, paddingHorizontal: 18, marginTop: 18 }}>
          <StatGrid items={stats} columns={stats.length >= 3 ? 3 : 2} />
        </Card>

        {/* Description */}
        {event.description ? (
          <Card elevation="sm" style={{ padding: 18, marginTop: 16 }}>
            <Txt variant="bodyLg" color="inkSoft" style={{ lineHeight: 24 }}>{event.description}</Txt>
          </Card>
        ) : null}

        {/* RSVP */}
        <View style={{ marginTop: 22, marginBottom: 8 }}><Eyebrow>Your RSVP</Eyebrow></View>
        {error ? <Text style={styles.errorTxt}>{error}</Text> : null}
        <Card elevation="sm" padded={false} style={{ overflow: "hidden" }}>
          {RSVP_OPTIONS.map((opt, i) => {
            const selected = status === opt.key;
            const tint = opt.key === "NO" ? palette.danger : palette.amberDeep;
            return (
              <Pressable
                key={opt.key}
                onPress={() => void handleRsvp(opt.key)}
                disabled={saving || event.is_cancelled}
                style={[
                  styles.rsvpRow,
                  i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.line },
                  selected && { backgroundColor: opt.key === "NO" ? palette.dangerSoft : palette.amberSofter },
                  (saving || event.is_cancelled) && { opacity: 0.55 },
                ]}
              >
                <Icon name={opt.icon} size={20} color={selected ? tint : palette.inkMuted} />
                <Text style={[styles.rsvpLabel, selected && { color: tint }]}>{opt.label}</Text>
                {selected ? <Icon name="check" size={18} color={tint} /> : null}
              </Pressable>
            );
          })}
        </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { width: "100%", height: 220, backgroundColor: palette.sunken },
  title: { ...type.h1, color: palette.ink, marginTop: 8 },
  locRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  locTxt: { fontFamily: font.regular, fontSize: 14, color: palette.inkSoft, flex: 1 },
  errorTxt: { fontFamily: font.regular, fontSize: 12, color: palette.danger, marginBottom: 8 },
  rsvpRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 18, paddingVertical: 16 },
  rsvpLabel: { fontFamily: font.bold, fontSize: 16, color: palette.ink, flex: 1 },
});
