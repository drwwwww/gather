import { useCallback, useMemo, useState } from "react";
import { View, Text, ScrollView, RefreshControl, TextInput, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Icon } from "../components/ui/Icon";
import {
  Screen, AppBar, Avatar, Pill, EmptyState, Loader,
  palette, font, radius, shadow, space,
} from "../components/ds";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";

type MemberRow = { id: string; full_name: string | null; email: string | null; role: string };

function roleTone(role: string): "amber" | "success" | "neutral" {
  if (role === "ADMIN") return "amber";
  if (role === "SERVICE") return "success";
  return "neutral";
}
function roleLabel(role: string): string {
  if (role === "ADMIN") return "Admin";
  if (role === "SERVICE") return "Service";
  return "Member";
}

export default function MembersScreen({ navigation }: any) {
  const { user, profile } = useAuth();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const client = supabase;
    if (!client || !profile?.church_id) { setMembers([]); setLoading(false); setRefreshing(false); return; }
    const { data, error } = await client
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("church_id", profile.church_id)
      .order("full_name", { ascending: true, nullsFirst: false });
    if (!error && data) {
      const rows = data as MemberRow[];
      const selfFirst = [...rows].sort((a, b) => {
        if (a.id === user?.id) return -1;
        if (b.id === user?.id) return 1;
        return (a.full_name || a.email || "").toLowerCase().localeCompare((b.full_name || b.email || "").toLowerCase());
      });
      setMembers(selfFirst);
    }
    setLoading(false); setRefreshing(false);
  }, [profile?.church_id, user?.id]);

  useFocusEffect(useCallback(() => { setLoading(true); void load(); }, [load]));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => (m.full_name ?? "").toLowerCase().includes(q) || (m.email ?? "").toLowerCase().includes(q));
  }, [members, search]);

  return (
    <Screen>
      <AppBar title="Members" onBack={() => navigation.goBack()} />
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Icon name="search" size={18} color={palette.inkMuted} />
          <TextInput
            placeholder="Search by name or email…"
            placeholderTextColor={palette.inkMuted}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: space.gutter, paddingTop: 14, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={palette.amber} />}
      >
        <Text style={styles.count}>{loading ? "Loading…" : `${filtered.length} ${filtered.length === 1 ? "person" : "people"}`}</Text>
        {loading ? (
          <Loader style={{ marginTop: 24 }} />
        ) : filtered.length === 0 ? (
          <EmptyState icon="members" title={search ? "No results" : "No members yet"} body={search ? `No members match "${search}".` : "When people join your church, they'll show up here."} />
        ) : (
          <View style={{ gap: 10 }}>
            {filtered.map((m) => {
              const displayName = m.full_name?.trim() || m.email?.split("@")[0] || "Member";
              const isSelf = m.id === user?.id;
              return (
                <View key={m.id} style={styles.row}>
                  <Avatar name={m.full_name} email={m.email} seed={m.id} size={46} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.name} numberOfLines={1}>
                      {displayName}{isSelf ? <Text style={styles.you}>  you</Text> : null}
                    </Text>
                    {m.email ? <Text style={styles.email} numberOfLines={1}>{m.email}</Text> : null}
                  </View>
                  <Pill label={roleLabel(m.role)} tone={roleTone(m.role)} />
                </View>
              );
            })}
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
  count: { fontFamily: font.regular, fontSize: 13, color: palette.inkMuted, marginBottom: 14 },
  row: { backgroundColor: palette.surface, borderRadius: radius.lg, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, ...shadow.sm },
  name: { fontFamily: font.bold, fontSize: 15, color: palette.ink },
  you: { fontFamily: font.regular, fontSize: 13, color: palette.inkMuted },
  email: { fontFamily: font.regular, fontSize: 12, color: palette.inkMuted, marginTop: 2 },
});
