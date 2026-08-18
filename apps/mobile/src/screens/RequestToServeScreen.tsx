import { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from "react-native";
import { Icon } from "../components/ui/Icon";
import {
  Screen, AppBar, Txt, Button,
  palette, font, radius, shadow, space,
} from "../components/ds";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";

type VolunteerRole = { id: string; name: string };

export default function RequestToServeScreen({ navigation }: any) {
  const { profile, refreshProfile } = useAuth();
  const [roles, setRoles] = useState<VolunteerRole[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!supabase || !profile?.church_id) { setLoadingRoles(false); return; }
      const { data } = await supabase
        .from("volunteer_roles")
        .select("id, name")
        .eq("church_id", profile.church_id)
        .order("name");
      if (!cancelled) {
        setRoles((data as VolunteerRole[]) ?? []);
        setLoadingRoles(false);
      }
    })();
    return () => { cancelled = true; };
  }, [profile?.church_id]);

  const toggleRole = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const roleIds = useMemo(() => Array.from(selected), [selected]);

  const handleSubmit = async () => {
    if (!supabase) return;
    setSubmitting(true);
    setError(null);
    const { error: rpcError } = await supabase.rpc("request_to_serve", {
      p_role_ids: roleIds,
      p_note: note.trim() || null,
    } as any);
    if (rpcError) {
      setSubmitting(false);
      setError("Couldn't send your request. Please try again.");
      return;
    }
    await refreshProfile();
    // The Serve tab only appears when showServe is passed at mount — reset so
    // the tab bar picks up the new role immediately instead of after a restart.
    navigation.reset({ index: 0, routes: [{ name: "MainTabs", params: { showServe: true } }] });
  };

  return (
    <Screen edges={["top", "bottom"]}>
      <AppBar title="Request to serve" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: space.gutter, paddingTop: 12, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introIcon}>
          <Icon name="serve" size={26} color={palette.amberDeep} />
        </View>
        <Txt variant="h1" style={{ marginBottom: 8 }}>Ready to serve?</Txt>
        <Txt variant="body" color="inkMuted" style={{ marginBottom: 24 }}>
          Let your church know you'd like to volunteer. Both fields below are optional — you can submit right away.
        </Txt>

        <Text style={styles.sectionLabel}>WHERE YOU'D LIKE TO SERVE</Text>
        {loadingRoles ? (
          <View style={styles.roleSkeleton} />
        ) : roles.length === 0 ? (
          <Text style={styles.helperText}>
            No specific roles are listed yet — that's okay, submit a general request below.
          </Text>
        ) : (
          <View style={styles.tagRow}>
            {roles.map((role) => {
              const active = selected.has(role.id);
              return (
                <Pressable
                  key={role.id}
                  onPress={() => toggleRole(role.id)}
                  style={[styles.tag, active ? styles.tagActive : styles.tagIdle]}
                >
                  <Text style={[styles.tagTxt, { color: active ? palette.onDark : palette.inkSoft }]}>{role.name}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>ANYTHING ELSE TO SHARE? (OPTIONAL)</Text>
        <View style={styles.noteCard}>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="e.g. I've led worship before, or I'm available most Sundays"
            placeholderTextColor={palette.inkMuted}
            style={styles.noteInput}
            multiline
          />
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTxt}>{error}</Text>
          </View>
        ) : null}

        <Button
          label={submitting ? "Sending…" : "Request to serve"}
          onPress={handleSubmit}
          loading={submitting}
          style={{ marginTop: 28 }}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  introIcon: {
    width: 52, height: 52, borderRadius: 18,
    backgroundColor: palette.amberSofter,
    alignItems: "center", justifyContent: "center",
    marginTop: 8, marginBottom: 18,
  },
  sectionLabel: { fontFamily: font.bold, fontSize: 11, color: palette.inkMuted, letterSpacing: 0.8, marginBottom: 10 },
  helperText: { fontFamily: font.regular, fontSize: 13, color: palette.inkMuted, lineHeight: 18 },
  roleSkeleton: { height: 36, borderRadius: radius.chip, backgroundColor: palette.sunken },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { borderRadius: radius.chip, paddingHorizontal: 14, paddingVertical: 9 },
  tagActive: { backgroundColor: palette.amber },
  tagIdle: { backgroundColor: palette.sunken },
  tagTxt: { fontFamily: font.semibold, fontSize: 13 },
  noteCard: {
    borderWidth: 1.5, borderColor: palette.line, backgroundColor: palette.surface,
    borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, ...shadow.sm,
  },
  noteInput: { fontFamily: font.regular, fontSize: 14, color: palette.ink, minHeight: 60, textAlignVertical: "top" },
  errorCard: { backgroundColor: palette.dangerSoft, borderRadius: radius.sm, padding: 12, marginTop: 16 },
  errorTxt: { fontFamily: font.regular, fontSize: 13, color: palette.dangerInk, lineHeight: 18 },
});
