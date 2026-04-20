import { useCallback, useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { AppShell } from "../components/app/AppShell";
import { StitchTabAppBar } from "../components/app/StitchTabAppBar";
import { EmptyState } from "../components/app/EmptyState";
import { GradientButton } from "../components/ui/GradientButton";
import { theme } from "../theme/theme";
import { stitchEditorialPanel, stitchHeroTitle, stitchHeroSubtitle } from "../theme/stitch";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";
import { Icon } from "../components/ui/Icon";

type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  publish_at: string | null;
  created_at: string;
};

function isPublished(a: AnnouncementRow): boolean {
  if (!a.publish_at) return false;
  return new Date(a.publish_at) <= new Date();
}

function formatRelativeLabel(publishAt: string | null, createdAt: string): string {
  const iso = publishAt ?? createdAt;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Recently";
  const diffMs = Date.now() - d.getTime();
  const days = Math.floor(diffMs / 86400000);
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
      setItems([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const { data, error } = await supabase
      .from("announcements")
      .select("id, title, body, publish_at, created_at")
      .eq("church_id", profile.church_id)
      .order("publish_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error) {
      const rows = (data ?? []) as AnnouncementRow[];
      const isAdmin = profile.role === "ADMIN";
      setItems(isAdmin ? rows : rows.filter(isPublished));
    }
    setLoading(false);
    setRefreshing(false);
  }, [user?.id, profile?.church_id, profile?.role]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load])
  );

  const visible = useMemo(() => items, [items]);
  const featured = visible[0];
  const rest = visible.slice(1);

  const openDetail = (a: AnnouncementRow) => {
    navigation.navigate("AnnouncementsDetail", {
      announcement: {
        id: a.id,
        title: a.title,
        body: a.body,
        publish_at: a.publish_at,
      },
    });
  };

  return (
    <AppShell>
      <StitchTabAppBar navigation={navigation} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
          />
        }
      >
        <View style={{ marginTop: 8, marginBottom: 48 }}>
          <Text style={stitchHeroTitle}>News</Text>
          <Text style={[stitchHeroSubtitle, { marginTop: 16, maxWidth: 360 }]}>
            Stay connected with the heart of our sanctuary. Updates, stories, and seasonal announcements.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: theme.spacing.xl }} />
        ) : visible.length === 0 ? (
          <EmptyState title="No announcements yet" description="When your church posts updates, they will appear here." />
        ) : (
          <View style={{ gap: 48 }}>
            {featured ? (
              <TouchableOpacity activeOpacity={0.92} onPress={() => openDetail(featured)} style={stitchEditorialPanel}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                  <Text
                    style={{
                      fontFamily: theme.typography.fontFamily,
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.bold as any,
                      color: theme.colors.primary,
                      letterSpacing: 2,
                      textTransform: "uppercase",
                    }}
                  >
                    Featured
                  </Text>
                  <Text
                    style={{
                      fontFamily: theme.typography.fontFamily,
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.medium as any,
                      color: theme.colors.textSecondary,
                    }}
                  >
                    {formatRelativeLabel(featured.publish_at, featured.created_at)}
                  </Text>
                </View>
                <Text
                  style={{
                    fontFamily: theme.typography.fontFamily,
                    fontSize: 22,
                    fontWeight: theme.typography.fontWeight.bold as any,
                    color: theme.colors.primaryText,
                    marginBottom: 12,
                  }}
                >
                  {featured.title}
                </Text>
                <Text
                  style={{
                    fontFamily: theme.typography.fontFamily,
                    fontSize: theme.typography.fontSize.lg,
                    lineHeight: 26,
                    color: theme.colors.textSecondary,
                    marginBottom: 24,
                  }}
                  numberOfLines={5}
                >
                  {excerpt(featured.body)}
                </Text>
                <View
                  style={{
                    width: "100%",
                    height: 192,
                    borderRadius: theme.radii.md,
                    backgroundColor: theme.colors.border,
                    marginBottom: 24,
                    overflow: "hidden",
                  }}
                />
                <GradientButton compact onPress={() => openDetail(featured)}>
                  Read full story
                </GradientButton>
              </TouchableOpacity>
            ) : null}

            <View style={{ gap: 40 }}>
              {rest.map((a, index) => {
                const rel = formatRelativeLabel(a.publish_at, a.created_at);
                const metaColor = theme.colors.textSecondary;
                const titleStyle = {
                  fontFamily: theme.typography.fontFamily,
                  fontSize: 20,
                  fontWeight: theme.typography.fontWeight.bold as any,
                  color: theme.colors.primaryText,
                  marginBottom: 8,
                };
                const bodyStyle = {
                  fontFamily: theme.typography.fontFamily,
                  fontSize: theme.typography.fontSize.lg,
                  lineHeight: 26,
                  color: theme.colors.textSecondary,
                };

                if (index === 2) {
                  return (
                    <TouchableOpacity
                      key={a.id}
                      activeOpacity={0.92}
                      onPress={() => openDetail(a)}
                      style={{ backgroundColor: "#FFF7E6", borderRadius: theme.radii.md, padding: 32 }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 16 }}>
                        <View
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 24,
                            backgroundColor: "#FFFFFF",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Icon name="volunteer" size={26} color={theme.colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={titleStyle}>{a.title}</Text>
                          <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: theme.typography.fontSize.sm, color: metaColor }}>{rel}</Text>
                        </View>
                      </View>
                      <Text style={[bodyStyle, { marginBottom: 0 }]} numberOfLines={6}>
                        {excerpt(a.body)}
                      </Text>
                    </TouchableOpacity>
                  );
                }

                if (index === 0) {
                  return (
                    <TouchableOpacity key={a.id} activeOpacity={0.92} onPress={() => openDetail(a)} style={{ paddingHorizontal: 8 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary }} />
                        <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.medium as any, color: metaColor }}>{rel}</Text>
                      </View>
                      <Text style={titleStyle}>{a.title}</Text>
                      <Text style={bodyStyle} numberOfLines={5}>
                        {excerpt(a.body)}
                      </Text>
                    </TouchableOpacity>
                  );
                }

                return (
                  <TouchableOpacity key={a.id} activeOpacity={0.92} onPress={() => openDetail(a)} style={{ paddingHorizontal: 8 }}>
                    <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.medium as any, color: metaColor, marginBottom: 8 }}>{rel}</Text>
                    <Text style={titleStyle}>{a.title}</Text>
                    <Text style={bodyStyle} numberOfLines={5}>
                      {excerpt(a.body)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </AppShell>
  );
}
