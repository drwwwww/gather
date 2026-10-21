import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet } from "react-native";
import { Icon } from "../components/ui/Icon";
import {
  Screen, AppBar, Avatar, Pill, EmptyState, Loader,
  palette, font, radius, shadow, space,
} from "../components/ds";
import { loadBlockedIds } from "../lib/blocks";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";

type EventResult = { id: string; title: string; location: string | null; start_at: string };
type AnnouncementResult = { id: string; title: string; body: string | null; publish_at: string | null; image_url: string | null };
type MemberResult = { id: string; full_name: string | null; email: string | null; role: string; avatar_url: string | null };

function whenLabel(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}
function roleLabel(role: string): string {
  if (role === "ADMIN") return "Admin";
  if (role === "SERVICE") return "Service";
  return "Member";
}

/** Searches everything tied to the member's own church — events, news, and
    people — from one place, reachable from Home's search icon. */
export default function SearchScreen({ navigation }: any) {
  const { profile } = useAuth();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<EventResult[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementResult[]>([]);
  const [members, setMembers] = useState<MemberResult[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (text: string) => {
    const client = supabase;
    const churchId = profile?.church_id;
    const q = text.trim();
    if (!client || !churchId || q.length < 2) {
      setEvents([]);
      setAnnouncements([]);
      setMembers([]);
      setLoading(false);
      return;
    }
    const like = `%${q}%`;
    const [eventsRes, announcementsRes, membersRes, blocked] = await Promise.all([
      client
        .from("events")
        .select("id, title, location, start_at")
        .eq("church_id", churchId)
        .eq("is_cancelled", false)
        .or(`title.ilike.${like},location.ilike.${like},description.ilike.${like}`)
        .order("start_at", { ascending: true })
        .limit(8),
      client
        .from("announcements")
        .select("id, title, body, publish_at, image_url")
        .eq("church_id", churchId)
        .or(`title.ilike.${like},body.ilike.${like}`)
        .order("publish_at", { ascending: false })
        .limit(8),
      client
        .from("profiles")
        .select("id, full_name, email, role, avatar_url")
        .eq("church_id", churchId)
        .or(`full_name.ilike.${like},email.ilike.${like}`)
        .order("full_name", { ascending: true })
        .limit(8),
      loadBlockedIds(),
    ]);
    setEvents((eventsRes.data as EventResult[]) ?? []);
    setAnnouncements((announcementsRes.data as AnnouncementResult[]) ?? []);
    setMembers(((membersRes.data as MemberResult[]) ?? []).filter((m) => !blocked.has(m.id)));
    setLoading(false);
  }, [profile?.church_id]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setEvents([]);
      setAnnouncements([]);
      setMembers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => void runSearch(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  const hasQuery = query.trim().length >= 2;
  const hasResults = events.length > 0 || announcements.length > 0 || members.length > 0;

  const resultCount = useMemo(
    () => events.length + announcements.length + members.length,
    [events, announcements, members]
  );

  return (
    <Screen>
      <AppBar title="Search" onBack={() => navigation.goBack()} />

      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Icon name="search" size={18} color={palette.inkMuted} />
          <TextInput
            placeholder="Search events, news, and people…"
            placeholderTextColor={palette.inkMuted}
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
            autoCapitalize="none"
            autoFocus
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: space.gutter, paddingTop: 6, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!hasQuery ? (
          <EmptyState icon="search" title="Search your church" body="Find events, announcements, and people — start typing above." />
        ) : loading ? (
          <Loader style={{ marginTop: 24 }} />
        ) : !hasResults ? (
          <EmptyState icon="search" title="No results" body={`Nothing matches "${query.trim()}".`} />
        ) : (
          <View style={{ gap: 22 }}>
            <Text style={styles.count}>{resultCount} result{resultCount === 1 ? "" : "s"}</Text>

            {events.length > 0 && (
              <View style={{ gap: 10 }}>
                <Text style={styles.sectionTitle}>Events</Text>
                {events.map((e) => (
                  <Pressable
                    key={e.id}
                    style={styles.row}
                    onPress={() => navigation.navigate("EventDetail", { eventId: e.id })}
                  >
                    <View style={styles.rowIcon}>
                      <Icon name="events" size={17} color={palette.amberDeep} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.rowTitle} numberOfLines={2}>{e.title}</Text>
                      <Text style={styles.rowMeta} numberOfLines={1}>
                        {whenLabel(e.start_at)}{e.location ? ` · ${e.location}` : ""}
                      </Text>
                    </View>
                    <Icon name="chevronRight" size={16} color={palette.inkMuted} />
                  </Pressable>
                ))}
              </View>
            )}

            {announcements.length > 0 && (
              <View style={{ gap: 10 }}>
                <Text style={styles.sectionTitle}>News &amp; updates</Text>
                {announcements.map((a) => (
                  <Pressable
                    key={a.id}
                    style={styles.row}
                    onPress={() =>
                      navigation.navigate("AnnouncementsDetail", {
                        announcement: {
                          id: a.id,
                          title: a.title,
                          body: a.body ?? "",
                          publish_at: a.publish_at,
                          image_url: a.image_url,
                        },
                      })
                    }
                  >
                    <View style={styles.rowIcon}>
                      <Icon name="announcements" size={17} color={palette.amberDeep} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.rowTitle} numberOfLines={2}>{a.title}</Text>
                      {a.body ? <Text style={styles.rowMeta} numberOfLines={1}>{a.body}</Text> : null}
                    </View>
                    <Icon name="chevronRight" size={16} color={palette.inkMuted} />
                  </Pressable>
                ))}
              </View>
            )}

            {members.length > 0 && (
              <View style={{ gap: 10 }}>
                <Text style={styles.sectionTitle}>People</Text>
                {members.map((m) => (
                  <Pressable
                    key={m.id}
                    style={styles.row}
                    onPress={() => navigation.navigate("Members")}
                  >
                    <Avatar imageUri={m.avatar_url} name={m.full_name} email={m.email} seed={m.id} size={38} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.rowTitle} numberOfLines={2}>
                        {m.full_name?.trim() || m.email?.split("@")[0] || "Member"}
                      </Text>
                      {m.email ? <Text style={styles.rowMeta} numberOfLines={1}>{m.email}</Text> : null}
                    </View>
                    <Pill label={roleLabel(m.role)} tone={m.role === "ADMIN" ? "amber" : m.role === "SERVICE" ? "success" : "neutral"} />
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchWrap: { paddingHorizontal: space.gutter, paddingTop: 4, paddingBottom: 8 },
  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: palette.glassStrong, borderRadius: radius.lg,
    paddingHorizontal: 16, paddingVertical: 13,
    borderWidth: StyleSheet.hairlineWidth, borderColor: palette.glassBorder, ...shadow.sm,
  },
  searchInput: { flex: 1, fontFamily: font.regular, fontSize: 15, color: palette.ink, padding: 0 },
  count: { fontFamily: font.regular, fontSize: 13, color: palette.inkMuted },
  sectionTitle: { fontFamily: font.bold, fontSize: 13, color: palette.inkMuted, textTransform: "uppercase", letterSpacing: 0.4 },
  row: {
    backgroundColor: palette.surface, borderRadius: radius.lg, padding: 12,
    flexDirection: "row", alignItems: "center", gap: 12, ...shadow.sm,
  },
  rowIcon: {
    width: 38, height: 38, borderRadius: radius.chip,
    backgroundColor: palette.amberSofter, alignItems: "center", justifyContent: "center",
  },
  rowTitle: { fontFamily: font.bold, fontSize: 14.5, color: palette.ink },
  rowMeta: { fontFamily: font.regular, fontSize: 12.5, color: palette.inkMuted, marginTop: 2 },
});
