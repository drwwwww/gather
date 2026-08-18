import { useCallback, useMemo, useState } from "react";
import { View, Text, Image, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Icon } from "../components/ui/Icon";
import {
  Screen, PressCard, Eyebrow, EmptyState, Loader, Pill,
  palette, font, radius, shadow, space, type,
} from "../components/ds";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";

type AnnouncementRow = { id: string; title: string; body: string; publish_at: string | null; created_at: string; image_url: string | null };

function isPublished(a: AnnouncementRow): boolean {
  if (!a.publish_at) return false;
  return new Date(a.publish_at) <= new Date();
}
function formatRelativeLabel(publishAt: string | null, createdAt: string): string {
  const d = new Date(publishAt ?? createdAt);
  if (Number.isNaN(d.getTime())) return "Recently";
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days < 0) return "Upcoming";
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "1 week ago";
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
function excerpt(body: string): string {
  return body.replace(/\s+/g, " ").trim();
}

export default function AnnouncementsScreen({ navigation }: any) {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<AnnouncementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!supabase || !user?.id || !profile?.church_id) {
      setItems([]); setLoading(false); setRefreshing(false);
      return;
    }
    const { data, error } = await supabase
      .from("announcements")
      .select("id, title, body, publish_at, created_at, image_url")
      .eq("church_id", profile.church_id)
      .order("publish_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error) {
      const rows = (data ?? []) as AnnouncementRow[];
      setItems(profile.role === "ADMIN" ? rows : rows.filter(isPublished));
    }
    setLoading(false); setRefreshing(false);
  }, [user?.id, profile?.church_id, profile?.role]);

  useFocusEffect(useCallback(() => { setLoading(true); void load(); }, [load]));

  const visible = useMemo(() => items, [items]);
  const featured = visible[0];
  const rest = visible.slice(1);

  const openDetail = (a: AnnouncementRow) =>
    navigation.navigate("AnnouncementsDetail", { announcement: { id: a.id, title: a.title, body: a.body, publish_at: a.publish_at, image_url: a.image_url } });

  return (
    <Screen>
      <View style={styles.header}>
        <Eyebrow>From your church</Eyebrow>
        <Text style={styles.pageTitle}>News & Updates</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: space.gutter, paddingTop: 12, paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={palette.amber} />}
      >
        {loading ? (
          <Loader />
        ) : visible.length === 0 ? (
          <EmptyState icon="announcements" title="No announcements yet" body="When your church posts updates, they'll appear here." />
        ) : (
          <View style={{ gap: 12 }}>
            {featured ? (
              <PressCard onPress={() => openDetail(featured)} style={styles.featured}>
                {featured.image_url ? (
                  <Image source={{ uri: featured.image_url }} style={styles.featuredImage} resizeMode="cover" />
                ) : null}
                <View style={{ padding: 22 }}>
                  <View style={styles.featuredTop}>
                    <Pill label="Latest" tone="amber" />
                    <Text style={styles.featuredDate}>{formatRelativeLabel(featured.publish_at, featured.created_at)}</Text>
                  </View>
                  <Text style={styles.featuredTitle}>{featured.title}</Text>
                  <Text style={styles.featuredBody} numberOfLines={4}>{excerpt(featured.body)}</Text>
                  <View style={styles.readMoreRow}>
                    <Text style={styles.readMore}>Read more</Text>
                    <Icon name="arrowRight" size={16} color={palette.amberDeep} />
                  </View>
                </View>
              </PressCard>
            ) : null}

            {rest.map((a) => (
              <PressCard key={a.id} onPress={() => openDetail(a)} style={styles.restCard}>
                <View style={styles.restAccent} />
                {a.image_url ? <Image source={{ uri: a.image_url }} style={styles.restThumb} /> : null}
                <View style={{ flex: 1 }}>
                  <View style={styles.restTop}>
                    <Text style={styles.restTitle} numberOfLines={2}>{a.title}</Text>
                    <Text style={styles.restDate}>{formatRelativeLabel(a.publish_at, a.created_at)}</Text>
                  </View>
                  <Text style={styles.restBody} numberOfLines={2}>{excerpt(a.body)}</Text>
                </View>
              </PressCard>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: space.gutter, paddingTop: 8, paddingBottom: 12 },
  pageTitle: { ...type.h1, color: palette.ink, marginTop: 6 },

  featured: { backgroundColor: palette.surface, borderRadius: radius.xl, overflow: "hidden", ...shadow.md },
  featuredImage: { width: "100%", height: 160, backgroundColor: palette.sunken },
  featuredTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  featuredDate: { fontFamily: font.regular, fontSize: 12, color: palette.inkMuted },
  featuredTitle: { fontFamily: font.bold, fontSize: 22, color: palette.ink, lineHeight: 28, letterSpacing: -0.3, marginBottom: 10 },
  featuredBody: { fontFamily: font.regular, fontSize: 15, lineHeight: 23, color: palette.inkSoft, marginBottom: 18 },
  readMoreRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  readMore: { fontFamily: font.bold, fontSize: 14, color: palette.amberDeep },

  restCard: { backgroundColor: palette.surface, borderRadius: radius.lg, padding: 16, flexDirection: "row", alignItems: "center", gap: 14, ...shadow.sm },
  restAccent: { width: 4, borderRadius: 2, backgroundColor: palette.amber, alignSelf: "stretch" },
  restThumb: { width: 48, height: 48, borderRadius: radius.sm, backgroundColor: palette.sunken },
  restTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 6 },
  restTitle: { fontFamily: font.bold, fontSize: 16, color: palette.ink, flex: 1 },
  restDate: { fontFamily: font.regular, fontSize: 11, color: palette.inkMuted, flexShrink: 0, marginTop: 2 },
  restBody: { fontFamily: font.regular, fontSize: 13, color: palette.inkSoft, lineHeight: 19 },
});
