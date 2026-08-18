import { useCallback, useState } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  Screen, AppBar, Eyebrow, EmptyState, Loader,
  palette, font, radius, shadow, space,
} from "../components/ds";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";

type NotificationRow = { id: string; type: string; payload: Record<string, unknown>; sent_at: string | null; read_at: string | null };

function titleFor(n: NotificationRow): string {
  if (n.type === "SERVE_REQUEST") {
    const p = n.payload as { requester_name?: string };
    return `${p?.requester_name?.trim() || "A member"} wants to serve`;
  }
  if (n.type !== "ASSIGNMENT_REMINDER") return n.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const p = n.payload as { source?: string };
  if (p?.source === "bulletin_part") return "Bulletin — run of show";
  if (p?.source === "bulletin_role") return "Bulletin — role";
  return "Assignment reminder";
}
function detailFor(n: NotificationRow): string {
  if (n.type === "SERVE_REQUEST") {
    const p = n.payload as { role_names?: string[]; note?: string | null };
    const roles = p?.role_names && p.role_names.length > 0 ? p.role_names.join(", ") : null;
    return [roles, p?.note ? `"${p.note}"` : null].filter(Boolean).join(" · ");
  }
  const p = n.payload as { scheduled_date?: string; source?: string; part_title?: string; role_name?: string };
  if (n.type !== "ASSIGNMENT_REMINDER") return "";
  let dateLine = "";
  if (p?.scheduled_date) {
    try { dateLine = new Date(p.scheduled_date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }); }
    catch { dateLine = ""; }
  }
  if (p?.source === "bulletin_part" && p.part_title) return [p.part_title, dateLine].filter(Boolean).join(" · ");
  if (p?.source === "bulletin_role" && p.role_name) return [p.role_name, dateLine].filter(Boolean).join(" · ");
  return dateLine;
}

export default function NotificationsScreen({ navigation }: any) {
  const { user } = useAuth();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const client = supabase;
    if (!client || !user?.id) { setLoading(false); return; }
    const { data, error } = await client
      .from("notification_log")
      .select("id, type, payload, sent_at, read_at")
      .eq("user_id", user.id)
      .order("sent_at", { ascending: false, nullsFirst: false })
      .limit(50);
    if (!error && data) setItems(data as NotificationRow[]);
    setLoading(false); setRefreshing(false);
  }, [user?.id]);

  useFocusEffect(useCallback(() => { setLoading(true); void load(); }, [load]));

  const markRead = async (id: string) => {
    const client = supabase;
    if (!client) return;
    const now = new Date().toISOString();
    const { error } = await client.from("notification_log").update({ read_at: now }).eq("id", id);
    if (!error) setItems((prev) => prev.map((r) => (r.id === id ? { ...r, read_at: now } : r)));
  };
  const markAllRead = async () => {
    const client = supabase;
    if (!client || !user?.id) return;
    const now = new Date().toISOString();
    const { error } = await client.from("notification_log").update({ read_at: now }).eq("user_id", user.id).is("read_at", null);
    if (!error) setItems((prev) => prev.map((r) => (r.read_at ? r : { ...r, read_at: now })));
  };

  const unread = items.filter((i) => !i.read_at).length;

  return (
    <Screen>
      <AppBar title="Notifications" onBack={() => navigation.goBack()} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: space.gutter, paddingTop: 12, paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={palette.amber} />}
      >
        <View style={styles.headerRow}>
          <View>
            <Eyebrow>Your inbox</Eyebrow>
            <Text style={styles.headerTitle}>{unread > 0 ? `${unread} unread` : "All caught up"}</Text>
          </View>
          {unread > 0 ? (
            <Pressable onPress={() => void markAllRead()} style={styles.markAll} hitSlop={6}>
              <Text style={styles.markAllTxt}>Mark all read</Text>
            </Pressable>
          ) : null}
        </View>

        {loading ? (
          <Loader />
        ) : items.length === 0 ? (
          <EmptyState icon="notifications" title="No notifications" body="You're all caught up." />
        ) : (
          <View style={{ gap: 10 }}>
            {items.map((n) => {
              const detail = detailFor(n);
              const isUnread = !n.read_at;
              return (
                <Pressable key={n.id} onPress={() => { if (isUnread) void markRead(n.id); }}>
                  <View style={[styles.card, !isUnread && styles.cardRead]}>
                    <View style={[styles.accent, { backgroundColor: isUnread ? palette.amber : palette.line }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.title, !isUnread && styles.titleRead]}>{titleFor(n)}</Text>
                      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
                      {n.sent_at ? (
                        <Text style={styles.time}>
                          {new Date(n.sent_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                        </Text>
                      ) : null}
                    </View>
                    {isUnread ? <View style={styles.newBadge}><Text style={styles.newBadgeTxt}>New</Text></View> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16, marginTop: 4 },
  headerTitle: { fontFamily: font.bold, fontSize: 24, color: palette.ink, letterSpacing: -0.3, marginTop: 4 },
  markAll: { backgroundColor: palette.glassStrong, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 9, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.glassBorder },
  markAllTxt: { fontFamily: font.semibold, fontSize: 13, color: palette.inkSoft },
  card: { backgroundColor: palette.surface, borderRadius: radius.lg, padding: 16, flexDirection: "row", alignItems: "flex-start", gap: 12, ...shadow.sm },
  cardRead: { backgroundColor: palette.glass, shadowOpacity: 0, elevation: 0 },
  accent: { width: 4, borderRadius: 2, alignSelf: "stretch" },
  title: { fontFamily: font.bold, fontSize: 15, color: palette.ink, marginBottom: 4 },
  titleRead: { fontFamily: font.semibold, color: palette.inkSoft },
  detail: { fontFamily: font.regular, fontSize: 13, color: palette.inkSoft, marginBottom: 6, lineHeight: 18 },
  time: { fontFamily: font.regular, fontSize: 11, color: palette.inkMuted, marginTop: 2 },
  newBadge: { backgroundColor: palette.amberSofter, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  newBadgeTxt: { fontFamily: font.bold, fontSize: 11, color: palette.amberDeep },
});
