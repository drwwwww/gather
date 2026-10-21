import { useCallback, useMemo, useState } from "react";
import { View, Text, ScrollView, RefreshControl, TextInput, Pressable, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Icon } from "../components/ui/Icon";
import {
  Screen, AppBar, Avatar, Pill, EmptyState, Loader,
  palette, font, radius, shadow, space,
} from "../components/ds";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";
import { MemberSafetySheet } from "../components/app/MemberSafetySheet";
import { loadBlockedIds, setBlocked } from "../lib/blocks";

type MemberRow = { id: string; full_name: string | null; email: string | null; role: string; avatar_url: string | null };

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
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const [showBlocked, setShowBlocked] = useState(false);
  const [sheetMember, setSheetMember] = useState<MemberRow | null>(null);

  const load = useCallback(async () => {
    const client = supabase;
    if (!client || !profile?.church_id) { setMembers([]); setLoading(false); setRefreshing(false); return; }
    const [{ data, error }, blocked] = await Promise.all([
      client
        .from("profiles")
        .select("id, full_name, email, role, avatar_url")
        .eq("church_id", profile.church_id)
        .order("full_name", { ascending: true, nullsFirst: false }),
      loadBlockedIds(),
    ]);
    setBlockedIds(blocked);
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
    const visible = members.filter((m) => !blockedIds.has(m.id));
    if (!q) return visible;
    return visible.filter((m) => (m.full_name ?? "").toLowerCase().includes(q) || (m.email ?? "").toLowerCase().includes(q));
  }, [members, search, blockedIds]);

  const blockedMembers = useMemo(() => members.filter((m) => blockedIds.has(m.id)), [members, blockedIds]);

  const toggleBlock = async (m: { id: string }) => {
    if (!user?.id) return;
    const next = !blockedIds.has(m.id);
    const ok = await setBlocked(user.id, m.id, next);
    if (!ok) return;
    setBlockedIds((prev) => {
      const s = new Set(prev);
      if (next) s.add(m.id); else s.delete(m.id);
      return s;
    });
  };

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
                <Pressable
                  key={m.id}
                  onPress={isSelf ? undefined : () => setSheetMember(m)}
                  disabled={isSelf}
                  style={({ pressed }: { pressed: boolean }) => [styles.row, pressed && { opacity: 0.85 }]}
                  accessibilityRole={isSelf ? undefined : "button"}
                  accessibilityHint={isSelf ? undefined : "Options to report or block"}
                >
                  <Avatar imageUri={m.avatar_url} name={m.full_name} email={m.email} seed={m.id} size={46} />
                  {/* Name gets the full width (wraps to 2 lines); the role sits under it instead of squeezing it. */}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.name} numberOfLines={2}>
                      {displayName}{isSelf ? <Text style={styles.you}>  (you)</Text> : null}
                    </Text>
                    {m.email ? <Text style={styles.email} numberOfLines={1} ellipsizeMode="middle">{m.email}</Text> : null}
                    <View style={{ marginTop: 6 }}><Pill label={roleLabel(m.role)} tone={roleTone(m.role)} /></View>
                  </View>
                  {!isSelf ? <Icon name="more" size={18} color={palette.inkMuted} /> : null}
                </Pressable>
              );
            })}
          </View>
        )}

        {!loading && blockedMembers.length > 0 ? (
          <View style={{ marginTop: 28 }}>
            <Pressable onPress={() => setShowBlocked((v) => !v)} style={styles.blockedToggle} accessibilityRole="button">
              <Text style={styles.blockedLabel}>Blocked · {blockedMembers.length}</Text>
              <Icon name={showBlocked ? "chevronLeft" : "chevronRight"} size={16} color={palette.inkMuted} />
            </Pressable>
            {showBlocked ? (
              <View style={{ gap: 10 }}>
                {blockedMembers.map((m) => (
                  <Pressable key={m.id} onPress={() => setSheetMember(m)} style={[styles.row, { opacity: 0.7 }]} accessibilityRole="button">
                    <Avatar imageUri={m.avatar_url} name={m.full_name} email={m.email} seed={m.id} size={40} />
                    <Text style={[styles.name, { flex: 1 }]} numberOfLines={1}>{m.full_name?.trim() || m.email || "Member"}</Text>
                    <Text style={styles.unblock}>Unblock</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <MemberSafetySheet
        member={sheetMember}
        isBlocked={sheetMember ? blockedIds.has(sheetMember.id) : false}
        onClose={() => setSheetMember(null)}
        onToggleBlock={toggleBlock}
      />
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
  blockedToggle: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44, marginBottom: 6 },
  blockedLabel: { fontFamily: font.semibold, fontSize: 13, color: palette.inkSoft },
  unblock: { fontFamily: font.semibold, fontSize: 13, color: palette.amberInk },
});
