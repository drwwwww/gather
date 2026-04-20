import { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { AppShell } from "../components/app/AppShell";
import { StitchStackBackRow, StitchHero } from "../components/app/StitchStackChrome";
import { EmptyState } from "../components/app/EmptyState";
import { theme } from "../theme/theme";
import { STITCH_PAD_H, stitchFilledCard } from "../theme/stitch";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";
import { useFocusEffect } from "@react-navigation/native";

type NotificationRow = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  sent_at: string | null;
  read_at: string | null;
};

function titleFor(n: NotificationRow): string {
  if (n.type !== "ASSIGNMENT_REMINDER") {
    return n.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  const p = n.payload as { source?: string };
  if (p?.source === "bulletin_part") return "Bulletin — run of show";
  if (p?.source === "bulletin_role") return "Bulletin — role";
  return "Assignment reminder";
}

function detailFor(n: NotificationRow): string {
  const p = n.payload as {
    scheduled_date?: string;
    source?: string;
    part_title?: string;
    role_name?: string;
  };
  if (n.type !== "ASSIGNMENT_REMINDER") return "";

  let dateLine = "";
  if (p?.scheduled_date) {
    try {
      dateLine = `Service date: ${new Date(p.scheduled_date + "T00:00:00").toLocaleDateString()}`;
    } catch {
      dateLine = "";
    }
  }

  if (p?.source === "bulletin_part" && p.part_title) {
    return [p.part_title, dateLine].filter(Boolean).join(" · ");
  }
  if (p?.source === "bulletin_role" && p.role_name) {
    return [p.role_name, dateLine].filter(Boolean).join(" · ");
  }

  return dateLine;
}

export default function NotificationsScreen({ navigation }: any) {
  const { user } = useAuth();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const client = supabase;
    if (!client || !user?.id) {
      setLoading(false);
      return;
    }
    const { data, error } = await client
      .from("notification_log")
      .select("id, type, payload, sent_at, read_at")
      .eq("user_id", user.id)
      .order("sent_at", { ascending: false, nullsFirst: false })
      .limit(50);

    if (!error && data) setItems(data as NotificationRow[]);
    setLoading(false);
    setRefreshing(false);
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const markRead = async (id: string) => {
    const client = supabase;
    if (!client) return;
    const now = new Date().toISOString();
    const { error } = await client.from("notification_log").update({ read_at: now }).eq("id", id);
    if (!error) {
      setItems((prev) => prev.map((row) => (row.id === id ? { ...row, read_at: now } : row)));
    }
  };

  const markAllRead = async () => {
    const client = supabase;
    if (!client || !user?.id) return;
    const now = new Date().toISOString();
    const { error } = await client.from("notification_log").update({ read_at: now }).eq("user_id", user.id).is("read_at", null);
    if (!error) {
      setItems((prev) => prev.map((row) => (row.read_at ? row : { ...row, read_at: now })));
    }
  };

  const unread = items.filter((i) => !i.read_at).length;

  return (
    <AppShell>
      <StitchStackBackRow navigation={navigation} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: STITCH_PAD_H }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        <StitchHero title="Notifications" subtitle="Reminders and updates for you." />

        {unread > 0 ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              alignSelf: "flex-start",
              gap: 8,
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: theme.colors.primarySoft,
              borderRadius: 999,
              marginBottom: theme.spacing.lg,
            }}
          >
            <TouchableOpacity onPress={markAllRead}>
              <Text style={{ fontFamily: theme.typography.fontFamily, color: theme.colors.primary, fontWeight: theme.typography.fontWeight.bold as any, fontSize: 12, letterSpacing: 1 }}>
                Mark all as read
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: theme.spacing.xl }} />
        ) : items.length === 0 ? (
          <EmptyState title="No notifications" description="You are all caught up." />
        ) : (
          <View style={{ gap: 16 }}>
            {items.map((n) => {
              const detail = detailFor(n);
              return (
                <TouchableOpacity
                  key={n.id}
                  activeOpacity={0.9}
                  onPress={() => {
                    if (!n.read_at) void markRead(n.id);
                  }}
                  style={{ opacity: n.read_at ? 0.72 : 1 }}
                >
                  <View style={stitchFilledCard()}>
                    <Text style={{ fontFamily: theme.typography.fontFamily, fontWeight: theme.typography.fontWeight.semibold as any, fontSize: 18, color: theme.colors.primaryText }}>{titleFor(n)}</Text>
                    {detail ? (
                      <Text style={{ fontFamily: theme.typography.fontFamily, color: theme.colors.textSecondary, marginTop: 8, fontSize: theme.typography.fontSize.sm }}>{detail}</Text>
                    ) : null}
                    {n.sent_at ? (
                      <Text style={{ fontFamily: theme.typography.fontFamily, color: theme.colors.muted, marginTop: 12, fontSize: theme.typography.fontSize.sm }}>
                        {new Date(n.sent_at).toLocaleString()}
                      </Text>
                    ) : null}
                    {!n.read_at ? (
                      <Text style={{ fontFamily: theme.typography.fontFamily, color: theme.colors.primary, marginTop: 8, fontSize: theme.typography.fontSize.sm }}>Tap to mark read</Text>
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
