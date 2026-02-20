import { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { theme } from '../theme/theme';
import { supabase } from "../supabase";

export default function ChurchSelectScreen({ navigation, route }: any) {
  const { userId, fullName, email } = route.params;
  const [churches, setChurches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any | null>(null);

  useEffect(() => {
    const fetchChurches = async () => {
      setLoading(true);
      setError(null);
      if (!supabase) return;
      const { data, error } = await supabase!.from("churches").select("id, name, slug").order("name");
      if (error) setError("Failed to load churches");
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
    // Try both exact and ilike (case-insensitive) search for debugging
    const { data, error } = await supabase!.from("churches").select("id, name, slug").or(`slug.eq.${slug.trim()},slug.ilike.%${slug.trim()}%`);
    console.log('Church search debug:', { slug: slug.trim(), data, error });
    if (error) {
      setError("Supabase error: " + error.message);
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
    setLoading(true);
    setError(null);
    const { error: profileError } = await supabase!.from("profiles").insert({
      id: userId,
      church_id: churchId,
      full_name: fullName,
      email: email,
      role: "MEMBER",
      disabled: false
    });
    setLoading(false);
    if (profileError) {
      setError("Failed to create profile. Please contact support.");
      return;
    }
    navigation.replace("SignIn");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.lg }}>
      <Text style={{
        fontFamily: theme.typography.fontFamily,
        fontSize: theme.typography.fontSize.title,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.primaryText,
        marginBottom: theme.spacing.sm,
      }}>Join Your Church</Text>
      <Text style={{
        fontFamily: theme.typography.fontFamily,
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.muted,
        marginBottom: theme.spacing.md,
      }}>Select your church to complete your account.</Text>

      <TextInput
        placeholder="Find by church slug (e.g. 'grace-baptist')"
        placeholderTextColor={theme.colors.muted}
        value={slug}
        onChangeText={setSlug}
        style={{
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.md,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          color: theme.colors.primaryText,
          marginBottom: theme.spacing.sm,
          backgroundColor: theme.colors.card,
        }}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        onSubmitEditing={handleSearch}
        editable={!searching}
      />
      <Button onPress={handleSearch} variant="primary" disabled={searching}>
        {searching ? "Searching..." : "Search by slug"}
      </Button>

      {searchResult && (
        <Card style={{ marginTop: theme.spacing.md }}>
          <Text style={{ fontWeight: theme.typography.fontWeight.bold, fontSize: theme.typography.fontSize.lg, color: theme.colors.primaryText }}>{searchResult.name}</Text>
          <Text style={{ color: theme.colors.muted }}>{searchResult.slug}</Text>
          <Button onPress={() => handleSelect(searchResult.id)} style={{ marginTop: theme.spacing.sm }}>
            Join this church
          </Button>
        </Card>
      )}

      {loading ? <ActivityIndicator style={{ marginTop: theme.spacing.lg }} /> : (
        <ScrollView style={{ marginTop: theme.spacing.md }}>
          {churches.length === 0 ? (
            <Text style={{ textAlign: 'center', color: theme.colors.muted, marginTop: theme.spacing.lg }}>No churches found. Try searching by slug or contact your admin.</Text>
          ) : (
            churches.map((church) => (
              <Card key={church.id}>
                <Text style={{ fontWeight: theme.typography.fontWeight.bold, fontSize: theme.typography.fontSize.lg, color: theme.colors.primaryText }}>{church.name}</Text>
                <Text style={{ color: theme.colors.muted }}>{church.slug}</Text>
                <Button onPress={() => handleSelect(church.id)} variant="secondary" style={{ marginTop: theme.spacing.sm }}>
                  Join this church
                </Button>
              </Card>
            ))
          )}
        </ScrollView>
      )}
      {error ? <Text style={{ color: theme.colors.error, marginTop: theme.spacing.md, textAlign: 'center' }}>{error}</Text> : null}
    </SafeAreaView>
  );
}
