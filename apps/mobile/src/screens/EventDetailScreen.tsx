import { useCallback, useState } from "react";
import { View, Text, Image, ScrollView, Pressable, StyleSheet, Platform } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { Icon, type AppIconName } from "../components/ui/Icon";
import {
  Screen, AppBar, Txt, Card, Pill, Eyebrow, Loader,
  palette, font, radius, space, type,
} from "../components/ds";
import { eventFallback } from "../lib/churchImagery";
import { eventWhen, eventPhase, eventAddress, openDirections, addToCalendar, shareEvent } from "../lib/events";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";

type RsvpStatus = "GOING" | "MAYBE" | "NO";
type EventRow = {
  id: string; title: string; description: string | null; location: string | null; address: string | null;
  start_at: string; end_at: string | null; is_cancelled: boolean; image_url: string | null;
  church_id: string;
};

const RSVP_OPTIONS: { key: RsvpStatus; label: string; icon: AppIconName }[] = [
  { key: "GOING", label: "Going", icon: "checkCircle" },
  { key: "MAYBE", label: "Maybe", icon: "calendar" },
  { key: "NO", label: "Can't go", icon: "close" },
];

/** One labelled line of event info — full width, so nothing is ever truncated. */
function InfoRow({ icon, label, children, last }: { icon: AppIconName; label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowDivider]} accessible accessibilityLabel={label}>
      <View style={styles.infoIcon}>
        <Icon name={icon} size={18} color={palette.amberInk} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>{children}</View>
    </View>
  );
}

function ActionButton({ icon, label, spoken, onPress, disabled }: { icon: AppIconName; label: string; spoken?: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={spoken ?? label}
      android_ripple={{ color: "rgba(30,26,38,0.08)" }}
      style={({ pressed }: { pressed: boolean }) => [
        styles.action,
        Platform.OS === "ios" && pressed && { opacity: 0.6 },
        disabled && { opacity: 0.4 },
      ]}
    >
      <Icon name={icon} size={20} color={palette.ink} />
      <Text style={styles.actionTxt} numberOfLines={1} maxFontSizeMultiplier={1.3}>{label}</Text>
    </Pressable>
  );
}

export default function EventDetailScreen({ navigation, route }: any) {
  const eventId = route.params?.eventId as string | undefined;
  const { user, profile } = useAuth();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [church, setChurch] = useState<{ name: string; address: string | null } | null>(null);
  const [isOwnChurch, setIsOwnChurch] = useState(true);
  const [status, setStatus] = useState<RsvpStatus | null>(null);
  const [rsvpCounts, setRsvpCounts] = useState<{ going: number; maybe: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    const client = supabase;
    if (!client || !user?.id || !eventId) { setEvent(null); setLoading(false); return; }
    setLoading(true); setError(null);
    const { data: ev, error: evErr } = await client
      .from("events")
      .select("id, title, description, location, address, start_at, end_at, is_cancelled, image_url, church_id")
      .eq("id", eventId)
      .maybeSingle();
    if (evErr || !ev) { setEvent(null); setLoading(false); return; }
    const row = ev as EventRow;
    setEvent(row);

    const own = row.church_id === profile?.church_id;
    setIsOwnChurch(own);
    const { data: churchRow } = await client.from("churches").select("name, address").eq("id", row.church_id).maybeSingle();
    setChurch((churchRow as { name: string; address: string | null } | null) ?? null);

    if (!own) {
      // RSVPs are scoped to your own church's events (rsvps_self_insert RLS) —
      // a nearby church's event is view-only.
      setRsvpCounts(null);
      setLoading(false);
      return;
    }

    const [rsvpRes, goingRes, maybeRes] = await Promise.all([
      client.from("event_rsvps").select("status").eq("event_id", eventId).eq("user_id", user.id).maybeSingle(),
      (client.from("event_rsvps") as any).select("*", { count: "exact", head: true }).eq("event_id", eventId).eq("status", "GOING"),
      (client.from("event_rsvps") as any).select("*", { count: "exact", head: true }).eq("event_id", eventId).eq("status", "MAYBE"),
    ]);
    setStatus(((rsvpRes.data as any)?.status as RsvpStatus) ?? null);
    setRsvpCounts({ going: goingRes.count ?? 0, maybe: maybeRes.count ?? 0 });
    setLoading(false);
  }, [eventId, user?.id, profile?.church_id]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const handleRsvp = async (nextStatus: RsvpStatus) => {
    if (!supabase || !user?.id || !eventId) return;
    const prev = status;
    setSaving(true); setError(null);
    setStatus(nextStatus);
    const { error: upsertError } = await supabase.from("event_rsvps").upsert(
      { event_id: eventId, user_id: user.id, status: nextStatus } as any,
      { onConflict: "event_id,user_id" }
    );
    setSaving(false);
    if (upsertError) {
      setStatus(prev);
      setError("Couldn't save your RSVP. Try again.");
      return;
    }
    Haptics.selectionAsync().catch(() => {});
    // Keep the counts honest without a reload.
    setRsvpCounts((c) => {
      if (!c) return c;
      const next = { ...c };
      if (prev === "GOING") next.going--;
      if (prev === "MAYBE") next.maybe--;
      if (nextStatus === "GOING") next.going++;
      if (nextStatus === "MAYBE") next.maybe++;
      return next;
    });
  };

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

  const { dateLine, timeLine } = eventWhen(event);
  const phase = eventPhase(event);
  const address = eventAddress(event, church?.address);
  const venue = event.location?.trim() || null;
  const ended = phase === "ended";

  const onCalendar = async () => {
    setNotice(null);
    try {
      const result = await addToCalendar(event, address);
      if (result === "saved") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setNotice("Added to your calendar.");
      }
    } catch (err) {
      // Show the real reason (permission off, sheet unavailable…) rather than a generic error.
      setNotice(err instanceof Error && err.message ? err.message : "Couldn't open your calendar.");
    }
  };

  return (
    <Screen>
      <AppBar onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: space.xxl }}>
        <Image
          source={event.image_url ? { uri: event.image_url } : eventFallback(event.id)}
          style={styles.hero}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
        <View style={{ paddingHorizontal: space.gutter, paddingTop: 18 }}>
          <View style={styles.pillRow}>
            {event.is_cancelled ? <Pill label="Cancelled" tone="danger" />
              : phase === "now" ? <Pill label="Happening now" tone="success" />
              : ended ? <Pill label="Ended" tone="neutral" />
              : null}
          </View>
          <Eyebrow>{!isOwnChurch && church ? `Event · ${church.name}` : "Event"}</Eyebrow>
          <Text style={styles.title} accessibilityRole="header">{event.title}</Text>
          {rsvpCounts && (rsvpCounts.going > 0 || rsvpCounts.maybe > 0) ? (
            <Text style={styles.attendance}>
              {rsvpCounts.going} going{rsvpCounts.maybe > 0 ? ` · ${rsvpCounts.maybe} maybe` : ""}
            </Text>
          ) : null}

          {/* When & where — each on its own full-width row */}
          <Card elevation="md" padded={false} style={{ marginTop: 18, overflow: "hidden" }}>
            <InfoRow icon="calendar" label={`Date: ${dateLine}`}>
              <Text style={styles.infoPrimary}>{dateLine}</Text>
            </InfoRow>
            <InfoRow icon="clock" label={`Time: ${timeLine}`} last={!venue && !address}>
              <Text style={styles.infoPrimary}>{timeLine}</Text>
            </InfoRow>
            {venue || address ? (
              <InfoRow icon="mapPin" label={`Location: ${[venue, address].filter(Boolean).join(", ")}`} last>
                {venue ? <Text style={styles.infoPrimary}>{venue}</Text> : null}
                {address ? <Text selectable style={venue ? styles.infoSecondary : styles.infoPrimary}>{address}</Text> : null}
              </InfoRow>
            ) : null}
          </Card>

          {/* Actions */}
          <View style={styles.actions}>
            {address ? <ActionButton icon="directions" label="Directions" onPress={() => void openDirections(address, venue ?? church?.name)} /> : null}
            <ActionButton icon="calendarPlus" label="Calendar" spoken="Add to calendar" onPress={() => void onCalendar()} disabled={ended || event.is_cancelled} />
            <ActionButton icon="share" label="Share" onPress={() => void shareEvent(event, address)} />
          </View>
          {notice ? <Text style={styles.notice}>{notice}</Text> : null}

          {event.description ? (
            <View style={{ marginTop: 22 }}>
              <View style={{ marginBottom: 8 }}><Eyebrow>About</Eyebrow></View>
              <Txt variant="bodyLg" color="inkSoft" style={{ lineHeight: 24 }}>{event.description}</Txt>
            </View>
          ) : null}

          {/* RSVP — your own church only; a nearby church's event is discovery-only. */}
          {!isOwnChurch && church ? (
            <Card elevation="sm" style={{ padding: 16, flexDirection: "row", alignItems: "flex-start", gap: 12, marginTop: 22 }}>
              <Icon name="church" size={20} color={palette.amberDeep} />
              <View style={{ flex: 1 }}>
                <Text style={styles.hostName}>Hosted by {church.name}</Text>
                {church.address ? <Text selectable style={styles.hostAddr}>{church.address}</Text> : null}
                <Text style={styles.hostNote}>RSVPs go to the host church — contact them to attend.</Text>
              </View>
            </Card>
          ) : (
            <View style={{ marginTop: 26 }}>
              <View style={{ marginBottom: 8 }}><Eyebrow>Your RSVP</Eyebrow></View>
              {ended || event.is_cancelled ? (
                <Text style={styles.closed}>{event.is_cancelled ? "This event was cancelled." : "This event has ended."}</Text>
              ) : (
                <>
                  {error ? <Text style={styles.errorTxt}>{error}</Text> : null}
                  <Card elevation="sm" padded={false} style={{ overflow: "hidden" }}>
                    {RSVP_OPTIONS.map((opt, i) => {
                      const selected = status === opt.key;
                      const tint = opt.key === "NO" ? palette.danger : palette.amberInk;
                      return (
                        <Pressable
                          key={opt.key}
                          onPress={() => void handleRsvp(opt.key)}
                          disabled={saving}
                          accessibilityRole="radio"
                          aria-checked={selected}
                          style={[
                            styles.rsvpRow,
                            i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.line },
                            selected && { backgroundColor: opt.key === "NO" ? palette.dangerSoft : palette.amberSofter },
                          ]}
                        >
                          <Icon name={opt.icon} size={20} color={selected ? tint : palette.inkMuted} />
                          <Text style={[styles.rsvpLabel, selected && { color: tint }]}>{opt.label}</Text>
                          {selected ? <Icon name="check" size={18} color={tint} /> : null}
                        </Pressable>
                      );
                    })}
                  </Card>
                </>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { width: "100%", height: 220, backgroundColor: palette.sunken },
  pillRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  title: { ...type.h1, color: palette.ink, marginTop: 8 },
  attendance: { fontFamily: font.medium, fontSize: 14, color: palette.inkSoft, marginTop: 6, fontVariant: ["tabular-nums"] },

  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  infoRowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.line },
  infoIcon: {
    width: 34, height: 34, borderRadius: radius.chip, backgroundColor: palette.amberSofter,
    alignItems: "center", justifyContent: "center",
  },
  infoPrimary: { fontFamily: font.semibold, fontSize: 15, lineHeight: 21, color: palette.ink, paddingTop: 6 },
  infoSecondary: { fontFamily: font.regular, fontSize: 14, lineHeight: 20, color: palette.inkSoft, marginTop: 2 },

  actions: { flexDirection: "row", gap: 10, marginTop: 14 },
  action: {
    flex: 1, minHeight: 64, borderRadius: radius.lg, backgroundColor: palette.surface,
    alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 6, overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth, borderColor: palette.line,
  },
  actionTxt: { fontFamily: font.semibold, fontSize: 12.5, color: palette.ink },
  notice: { fontFamily: font.regular, fontSize: 13, color: palette.inkSoft, marginTop: 10 },

  hostName: { fontFamily: font.semibold, fontSize: 15, color: palette.ink },
  hostAddr: { fontFamily: font.regular, fontSize: 14, lineHeight: 20, color: palette.inkSoft, marginTop: 2 },
  hostNote: { fontFamily: font.regular, fontSize: 13, lineHeight: 19, color: palette.inkMuted, marginTop: 6 },

  closed: { fontFamily: font.medium, fontSize: 14, color: palette.inkSoft },
  errorTxt: { fontFamily: font.regular, fontSize: 13, color: palette.dangerInk, marginBottom: 8 },
  rsvpRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 18, minHeight: 56 },
  rsvpLabel: { fontFamily: font.bold, fontSize: 16, color: palette.ink, flex: 1 },
});
