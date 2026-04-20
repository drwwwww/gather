import { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, TextInput, Pressable } from "react-native";
import { GradientButton } from "../components/ui/GradientButton";
import { AppShell } from "../components/app/AppShell";
import { GatherMark } from "../components/app/GatherMark";
import { StitchHero } from "../components/app/StitchStackChrome";
import { theme } from "../theme/theme";
import { STITCH_PAD_H, stitchFilledCard, stitchTextField } from "../theme/stitch";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";

export default function ChurchSelectScreen({ navigation, route }: any) {
  const { refreshProfile } = useAuth();
  const { userId, fullName, email } = route.params ?? {};
  const [churches, setChurches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any | null>(null);

  useEffect(() => {
    const fetchChurches = async () => {
      setLoading(true);
      setError(null);
      if (!supabase) return;
      const { data, error: err } = await supabase.from("churches").select("id, name, slug").order("name");
      if (err) setError("Failed to load churches");
      setChurches(data || []);
      setLoading(false);
    };
    fetchChurches();
  }, []);

  const handleSearch = async () => {
    setSearching(true);
    setSearchResult(null);
    setError(null);
    if (!supabase || !slug.trim()) {
      setSearching(false);
      return;
    }
    const { data, error: err } = await supabase
      .from("churches")
      .select("id, name, slug")
      .or(`slug.eq.${slug.trim()},slug.ilike.%${slug.trim()}%`);
    if (err) {
      setError("Supabase error: " + err.message);
      setSearchResult(null);
    } else if (!data || data.length === 0) {
      setError("No church found with that slug.");
      setSearchResult(null);
    } else {
      setSearchResult(data[0]);
    }
    setSearching(false);
  };

  const handleSelect = async (churchId: string) => {
    setJoining(true);
    setError(null);
    const authRes = await supabase?.auth.getUser();
    const u = authRes?.data?.user;
    const uid = userId ?? u?.id;
    const name = fullName ?? (u?.user_metadata?.full_name as string | undefined) ?? "";
    const em = email ?? u?.email ?? "";
    if (!uid) {
      setError("Session expired. Please sign in again.");
      setJoining(false);
      return;
    }
    const { error: profileError } = await supabase!.from("profiles").upsert(
      {
        id: uid,
        church_id: churchId,
        full_name: name || null,
        email: em || null,
        role: "MEMBER",
        disabled: false,
      },
      { onConflict: "id" }
    );
    setJoining(false);
    if (profileError) {
      setError("Failed to create profile. Please contact support.");
      return;
    }
    await refreshProfile();
  };

  return (
    <AppShell>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: STITCH_PAD_H,
          paddingTop: theme.spacing.md,
          paddingBottom: theme.spacing.xl * 2,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "flex-start", alignItems: "center", marginBottom: theme.spacing.md }}>
          <GatherMark layout="row" flat />
        </View>

        <StitchHero
          title="Join your church"
          subtitle="Find your local community and stay connected with the heartbeat of your sanctuary."
          marginBottom={theme.spacing.lg}
        />

        <Text
          style={{
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.medium as any,
            color: theme.colors.textSecondary,
            marginBottom: 8,
            paddingLeft: 4,
          }}
        >
          Search by name or slug
        </Text>
        <TextInput
          placeholder="e.g. grace-church"
          placeholderTextColor={theme.colors.textMuted}
          value={slug}
          onChangeText={setSlug}
          style={[stitchTextField, { marginBottom: theme.spacing.md }]}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
          editable={!searching}
        />

        <GradientButton onPress={handleSearch} disabled={searching}>
          {searching ? "Searching…" : "Search"}
        </GradientButton>

        {searchResult ? (
          <View style={[stitchFilledCard(), { marginTop: theme.spacing.lg }]}>
            <Text
              style={{
                fontFamily: theme.typography.fontFamily,
                fontWeight: theme.typography.fontWeight.semibold as any,
                fontSize: 20,
                color: theme.colors.primaryText,
              }}
            >
              {searchResult.name}
            </Text>
            <Text style={{ fontFamily: theme.typography.fontFamily, color: theme.colors.textSecondary, marginTop: 6 }}>@{searchResult.slug}</Text>
            <View style={{ marginTop: theme.spacing.md }}>
              <GradientButton compact onPress={() => handleSelect(searchResult.id)} disabled={joining}>
                {joining ? "Joining…" : "Join this church"}
              </GradientButton>
            </View>
          </View>
        ) : null}

        {loading && churches.length === 0 ? (
          <ActivityIndicator style={{ marginTop: theme.spacing.xl }} color={theme.colors.primary} />
        ) : (
          <View style={{ marginTop: theme.spacing.lg }}>
            <Text
              style={{
                fontFamily: theme.typography.fontFamily,
                fontSize: 12,
                fontWeight: theme.typography.fontWeight.bold as any,
                color: theme.colors.textSecondary,
                letterSpacing: 3,
                textTransform: "uppercase",
                marginBottom: theme.spacing.md,
                paddingHorizontal: 8,
              }}
            >
              All churches
            </Text>
            {churches.length === 0 ? (
              <Text style={{ textAlign: "center", color: theme.colors.muted, marginTop: theme.spacing.lg, fontFamily: theme.typography.fontFamily }}>
                No churches found. Try searching by slug or contact your admin.
              </Text>
            ) : (
              churches.map((church) => (
                <View key={church.id} style={[stitchFilledCard(), { marginBottom: 16 }]}>
                  <Text
                    style={{
                      fontFamily: theme.typography.fontFamily,
                      fontWeight: theme.typography.fontWeight.semibold as any,
                      fontSize: 20,
                      color: theme.colors.primaryText,
                    }}
                  >
                    {church.name}
                  </Text>
                  <Text style={{ fontFamily: theme.typography.fontFamily, color: theme.colors.textSecondary, marginTop: 6 }}>@{church.slug}</Text>
                  <Pressable
                    onPress={() => handleSelect(church.id)}
                    disabled={joining}
                    style={({ pressed }) => ({
                      marginTop: theme.spacing.md,
                      borderRadius: 999,
                      paddingVertical: 12,
                      paddingHorizontal: theme.spacing.lg,
                      alignItems: "center",
                      backgroundColor: pressed ? theme.colors.surface2 : theme.colors.surface,
                      opacity: joining ? 0.55 : 1,
                    })}
                  >
                    <Text
                      style={{
                        fontFamily: theme.typography.fontFamily,
                        fontSize: theme.typography.fontSize.sm,
                        fontWeight: theme.typography.fontWeight.bold as any,
                        color: theme.colors.textSecondary,
                      }}
                    >
                      {joining ? "Joining…" : "Join this church"}
                    </Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>
        )}

        {error ? (
          <Text style={{ color: theme.colors.error, marginTop: theme.spacing.md, textAlign: "center", fontFamily: theme.typography.fontFamily }}>
            {error}
          </Text>
        ) : null}
      </ScrollView>
    </AppShell>
  );
}
