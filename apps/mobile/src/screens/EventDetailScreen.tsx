import { useCallback, useMemo, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { AppShell } from "../components/app/AppShell";
import { StitchStackBackRow, StitchHero } from "../components/app/StitchStackChrome";
import { GradientButton } from "../components/ui/GradientButton";
import { theme } from "../theme/theme";
import { STITCH_PAD_H, stitchFilledCard } from "../theme/stitch";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";

type RsvpStatus = "GOING" | "MAYBE" | "NO";

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_at: string;
  is_cancelled: boolean;
};

export default function EventDetailScreen({ navigation, route }: any) {
  const eventId = route.params?.eventId as string | undefined;
  const { user } = useAuth();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [status, setStatus] = useState<RsvpStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const client = supabase;
    if (!client || !user?.id || !eventId) {
      setEvent(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data: ev, error: evErr } = await client
      .from("events")
      .select("id, title, description, location, start_at, is_cancelled")
      .eq("id", eventId)
      .maybeSingle();

    if (evErr || !ev) {
      setEvent(null);
      setLoading(false);
      return;
    }

    setEvent(ev as EventRow);

    const { data: rsvp } = await client.from("event_rsvps").select("status").eq("event_id", eventId).eq("user_id", user.id).maybeSingle();

    setStatus((rsvp?.status as RsvpStatus) ?? null);
    setLoading(false);
  }, [eventId, user?.id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const handleRsvp = async (nextStatus: RsvpStatus) => {
    if (!supabase || !user?.id || !eventId) return;
    setSaving(true);
    setError(null);
    const { error: upsertError } = await supabase.from("event_rsvps").upsert(
      { event_id: eventId, user_id: user.id, status: nextStatus },
      { onConflict: "event_id,user_id" }
    );
    if (upsertError) {
      setError(upsertError.message);
      setSaving(false);
      return;
    }
    setStatus(nextStatus);
    setSaving(false);
  };

  const summary = useMemo(() => {
    if (!event) return "";
    const when = (() => {
      try {
        return new Date(event.start_at).toLocaleString();
      } catch {
        return event.start_at;
      }
    })();
    return `${when}${event.location ? ` · ${event.location}` : ""}`;
  }, [event]);

  if (!eventId) {
    return (
      <AppShell>
        <StitchStackBackRow navigation={navigation} />
        <View style={{ paddingHorizontal: STITCH_PAD_H }}>
          <StitchHero title="Event" subtitle="Missing event." marginBottom={theme.spacing.md} />
        </View>
      </AppShell>
    );
  }

  if (loading) {
    return (
      <AppShell>
        <StitchStackBackRow navigation={navigation} />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: STITCH_PAD_H }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <StitchStackBackRow navigation={navigation} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: STITCH_PAD_H }}>
        <StitchHero title={event?.title ?? "Event"} subtitle={summary} />

        {!event ? (
          <View style={stitchFilledCard()}>
            <Text style={{ fontFamily: theme.typography.fontFamily, color: theme.colors.textSecondary }}>This event could not be loaded.</Text>
          </View>
        ) : (
          <View style={stitchFilledCard()}>
            {event.is_cancelled ? (
              <Text style={{ fontFamily: theme.typography.fontFamily, color: theme.colors.danger, marginBottom: theme.spacing.sm, fontWeight: theme.typography.fontWeight.semibold as any }}>
                This event was cancelled.
              </Text>
            ) : null}
            <Text style={{ fontFamily: theme.typography.fontFamily, fontWeight: theme.typography.fontWeight.semibold as any, fontSize: 18, color: theme.colors.primaryText, marginBottom: theme.spacing.xs }}>
              {event.location?.trim() || "Location TBD"}
            </Text>
            {event.description ? (
              <Text style={{ fontFamily: theme.typography.fontFamily, color: theme.colors.textSecondary, marginBottom: theme.spacing.md, lineHeight: 22 }}>{event.description}</Text>
            ) : null}

            {error ? (
              <Text style={{ fontFamily: theme.typography.fontFamily, color: theme.colors.error, marginBottom: theme.spacing.sm }}>{error}</Text>
            ) : null}

            <Text
              style={{
                fontFamily: theme.typography.fontFamily,
                fontSize: 12,
                fontWeight: theme.typography.fontWeight.bold as any,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: theme.colors.textSecondary,
                marginBottom: theme.spacing.sm,
              }}
            >
              Your RSVP
            </Text>

            <GradientButton compact onPress={() => handleRsvp("GOING")} disabled={saving || event.is_cancelled} style={{ marginBottom: 12 }}>
              {status === "GOING" ? "Going ✓" : saving ? "Saving…" : "RSVP Going"}
            </GradientButton>

            <Pressable
              onPress={() => handleRsvp("MAYBE")}
              disabled={saving || event.is_cancelled}
              style={({ pressed }) => ({
                borderRadius: 999,
                paddingVertical: 12,
                alignItems: "center",
                backgroundColor: pressed ? theme.colors.surface2 : theme.colors.surface,
                marginBottom: 12,
                opacity: saving ? 0.55 : 1,
              })}
            >
              <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.bold as any, color: theme.colors.textSecondary }}>
                {status === "MAYBE" ? "Maybe ✓" : "Maybe"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleRsvp("NO")}
              disabled={saving || event.is_cancelled}
              style={({ pressed }) => ({
                borderRadius: 999,
                paddingVertical: 12,
                alignItems: "center",
                backgroundColor: pressed ? theme.colors.surface2 : theme.colors.surface,
                opacity: saving ? 0.55 : 1,
              })}
            >
              <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.bold as any, color: theme.colors.textSecondary }}>
                {status === "NO" ? "Can’t go ✓" : "Can’t go"}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </AppShell>
  );
}
