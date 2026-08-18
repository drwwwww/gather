import { useEffect, useState } from "react";
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet } from "react-native";
import { Icon } from "../components/ui/Icon";
import {
  Screen, Txt, Button, BrandMark, Loader, Eyebrow, OnboardingProgress,
  palette, font, radius, shadow, space,
} from "../components/ds";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";

type Church = { id: string; name: string; slug: string };

export default function ChurchSelectScreen({ route }: any) {
  const { refreshProfile } = useAuth();
  const { userId, showOnboardingProgress } = route.params ?? {};
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<Church | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      if (!supabase) return;
      const { data, error: err } = await supabase.from("churches").select("id, name, slug").order("name");
      if (err) setError("Failed to load churches");
      setChurches((data as Church[]) || []);
      setLoading(false);
    })();
  }, []);

  const handleSearch = async () => {
    setSearching(true); setSearchResult(null); setError(null);
    if (!supabase || !slug.trim()) { setSearching(false); return; }
    const { data, error: err } = await supabase
      .from("churches")
      .select("id, name, slug")
      .or(`slug.eq.${slug.trim()},slug.ilike.%${slug.trim()}%`);
    if (err) { setError("Supabase error: " + err.message); setSearchResult(null); }
    else if (!data || data.length === 0) { setError("No church found with that slug."); setSearchResult(null); }
    else setSearchResult(data[0] as Church);
    setSearching(false);
  };

  const handleSelect = async (churchId: string) => {
    setJoining(churchId); setError(null);
    const authRes = await supabase?.auth.getUser();
    const u = authRes?.data?.user;
    const uid = userId ?? u?.id;
    if (!uid) { setError("Session expired. Please sign in again."); setJoining(null); return; }
    // By the time anyone reaches this screen, AuthContext has already created
    // their profiles row (and the profile-builder screens may have filled in
    // more of it) — this only needs to attach the church.
    const { error: profileError } = await supabase!.from("profiles").update({ church_id: churchId } as any).eq("id", uid);
    setJoining(null);
    if (profileError) { setError("Failed to join that church. Please contact support."); return; }
    await refreshProfile();
  };

  const ChurchCard = ({ church, highlight }: { church: Church; highlight?: boolean }) => (
    <View style={[styles.churchCard, highlight && styles.churchCardHi]}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.churchName} numberOfLines={1}>{church.name}</Text>
        <Text style={styles.churchSlug}>@{church.slug}</Text>
      </View>
      <Button label={joining === church.id ? "Joining…" : "Join"} full={false} loading={joining === church.id} onPress={() => handleSelect(church.id)} style={{ minHeight: 40, paddingHorizontal: 20 }} />
    </View>
  );

  return (
    <Screen edges={["top", "bottom"]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: space.gutter, paddingTop: 20, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <BrandMark size={32} rounding={10} glow />
          <Text style={styles.brand}>Gather</Text>
        </View>

        {showOnboardingProgress ? <OnboardingProgress step={4} total={4} label="Find your church" /> : null}

        {/* Hero */}
        <Eyebrow>Welcome</Eyebrow>
        <Txt variant="h1" style={{ marginTop: 6, marginBottom: 8 }}>Join your church</Txt>
        <Txt variant="body" color="inkSoft" style={{ marginBottom: 24 }}>
          Find your community and stay connected with the heartbeat of your church.
        </Txt>

        {/* Search */}
        <View style={styles.searchBox}>
          <Icon name="search" size={18} color={palette.inkMuted} />
          <TextInput
            placeholder="Search by name or slug"
            placeholderTextColor={palette.inkMuted}
            value={slug}
            onChangeText={setSlug}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            editable={!searching}
          />
        </View>
        <Button label={searching ? "Searching…" : "Search"} loading={searching} onPress={handleSearch} style={{ marginTop: 12 }} />

        {searchResult ? <View style={{ marginTop: 20 }}><ChurchCard church={searchResult} highlight /></View> : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* All churches */}
        <Text style={styles.allLabel}>All churches</Text>
        {loading && churches.length === 0 ? (
          <Loader />
        ) : churches.length === 0 ? (
          <Txt variant="body" color="inkMuted" center style={{ marginTop: 20 }}>
            No churches found. Try searching by slug or contact your admin.
          </Txt>
        ) : (
          <View style={{ gap: 10 }}>
            {churches.map((c) => <ChurchCard key={c.id} church={c} />)}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { fontFamily: font.bold, fontSize: 19, color: palette.ink, letterSpacing: -0.4 },
  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: palette.surface, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 14, borderWidth: 1.5, borderColor: palette.line,
  },
  searchInput: { flex: 1, fontFamily: font.regular, fontSize: 15, color: palette.ink, padding: 0 },
  error: { fontFamily: font.regular, fontSize: 13, color: palette.danger, textAlign: "center", marginTop: 16 },
  allLabel: { fontFamily: font.bold, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: palette.inkMuted, marginTop: 32, marginBottom: 14 },
  churchCard: { backgroundColor: palette.surface, borderRadius: radius.md, padding: 16, flexDirection: "row", alignItems: "center", gap: 12, ...shadow.sm },
  churchCardHi: { borderWidth: 1.5, borderColor: palette.amber },
  churchName: { fontFamily: font.bold, fontSize: 16, color: palette.ink },
  churchSlug: { fontFamily: font.regular, fontSize: 13, color: palette.inkMuted, marginTop: 2 },
});
