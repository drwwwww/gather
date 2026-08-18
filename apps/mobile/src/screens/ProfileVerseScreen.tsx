import { useState } from "react";
import { View, Text, Pressable, TextInput, ScrollView, StyleSheet } from "react-native";
import { Icon, AppIconName } from "../components/ui/Icon";
import {
  Screen, Txt, Button, OnboardingProgress,
  palette, font, radius,
} from "../components/ds";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";

const COMMON_VERSES = [
  { ref: "John 3:16", text: "For God so loved the world that he gave his one and only Son." },
  { ref: "Philippians 4:13", text: "I can do all things through Christ who strengthens me." },
  { ref: "Jeremiah 29:11", text: "For I know the plans I have for you, plans to prosper you." },
  { ref: "Psalm 23:1", text: "The Lord is my shepherd; I shall not want." },
  { ref: "Romans 8:28", text: "In all things God works for the good of those who love him." },
];

const MINISTRY_OPTIONS: { key: string; label: string; icon: AppIconName }[] = [
  { key: "worship", label: "Worship", icon: "sparkle" },
  { key: "kids", label: "Kids", icon: "groups" },
  { key: "hospitality", label: "Hospitality", icon: "handshake" },
  { key: "tech", label: "Tech", icon: "laptop" },
  { key: "prayer", label: "Prayer", icon: "bookOpen" },
  { key: "greeting", label: "Greeting", icon: "wave" },
];

export default function ProfileVerseScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const [selectedVerse, setSelectedVerse] = useState<string | null>(profile?.favorite_verse ?? null);
  const [customVerse, setCustomVerse] = useState("");
  const [writingOwn, setWritingOwn] = useState(false);
  const [interests, setInterests] = useState<Set<string>>(new Set(profile?.ministry_interests ?? []));
  const [saving, setSaving] = useState(false);

  const toggleInterest = (key: string) => {
    setInterests((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const chooseVerse = (ref: string) => {
    setWritingOwn(false);
    setSelectedVerse(ref);
  };

  const finish = async () => {
    if (!supabase || !user?.id) return;
    setSaving(true);
    const finalVerse = writingOwn ? (customVerse.trim() || null) : selectedVerse;
    await supabase
      .from("profiles")
      .update({
        favorite_verse: finalVerse,
        ministry_interests: interests.size > 0 ? Array.from(interests) : null,
        profile_completed_at: new Date().toISOString(),
      } as any)
      .eq("id", user.id);
    setSaving(false);
    // Marking profile_completed_at flips RootNavigator from the builder to
    // church selection — no explicit navigate() needed once it re-fetches.
    await refreshProfile();
  };

  return (
    <Screen edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 28, paddingTop: 20, paddingBottom: 32, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <OnboardingProgress step={3} total={4} label="Make it yours" />

        <Txt variant="h1" style={{ marginBottom: 8 }}>Make it yours</Txt>
        <Txt variant="body" color="inkMuted" style={{ marginBottom: 24 }}>
          A verse for your profile, and — if you'd like — where you might enjoy serving. All optional.
        </Txt>

        <Text style={styles.sectionLabel}>FAVORITE VERSE</Text>
        <View style={{ gap: 8, marginBottom: 8 }}>
          {COMMON_VERSES.map((v) => {
            const active = !writingOwn && selectedVerse === v.ref;
            return (
              <Pressable
                key={v.ref}
                onPress={() => chooseVerse(v.ref)}
                style={[styles.verseCard, active && styles.verseCardActive]}
              >
                <Text style={[styles.verseRef, active && { color: palette.amberDeep }]}>{v.ref}</Text>
                <Text style={styles.verseText} numberOfLines={2}>{v.text}</Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => { setWritingOwn(true); setSelectedVerse(null); }}
            style={[styles.verseCard, writingOwn && styles.verseCardActive]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Icon name="pencil" size={15} color={writingOwn ? palette.amberDeep : palette.inkMuted} />
              <Text style={[styles.verseRef, writingOwn && { color: palette.amberDeep }]}>Write your own</Text>
            </View>
            {writingOwn ? (
              <TextInput
                value={customVerse}
                onChangeText={setCustomVerse}
                placeholder="Type a reference or the verse itself…"
                placeholderTextColor={palette.inkMuted}
                style={styles.verseInput}
                multiline
              />
            ) : null}
          </Pressable>
        </View>

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>HOW YOU MIGHT LIKE TO SERVE</Text>
        <View style={styles.tagRow}>
          {MINISTRY_OPTIONS.map((opt) => {
            const active = interests.has(opt.key);
            return (
              <Pressable
                key={opt.key}
                onPress={() => toggleInterest(opt.key)}
                style={[styles.tag, active ? styles.tagActive : styles.tagIdle]}
              >
                <Icon name={opt.icon} size={14} color={active ? palette.onDark : palette.inkSoft} />
                <Text style={[styles.tagTxt, { color: active ? palette.onDark : palette.inkSoft }]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ flex: 1, minHeight: 20 }} />

        <Button label="Continue" onPress={finish} loading={saving} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { fontFamily: font.bold, fontSize: 11, color: palette.inkMuted, letterSpacing: 0.8, marginBottom: 10 },
  verseCard: {
    borderWidth: 1.5,
    borderColor: palette.line,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  verseCardActive: { borderColor: palette.amber, backgroundColor: palette.amberSofter },
  verseRef: { fontFamily: font.bold, fontSize: 14, color: palette.ink },
  verseText: { fontFamily: font.regular, fontSize: 12.5, color: palette.inkMuted, marginTop: 2 },
  verseInput: {
    fontFamily: font.regular,
    fontSize: 14,
    color: palette.ink,
    marginTop: 8,
    minHeight: 44,
    textAlignVertical: "top",
  },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: radius.chip, paddingHorizontal: 14, paddingVertical: 9 },
  tagActive: { backgroundColor: palette.amber },
  tagIdle: { backgroundColor: palette.sunken },
  tagTxt: { fontFamily: font.semibold, fontSize: 13 },
});
