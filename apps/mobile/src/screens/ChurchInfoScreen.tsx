import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { Icon } from "../components/ui/Icon";
import {
  Screen, AppBar, Txt, Eyebrow, Divider, Loader, BrandMark,
  palette, font, radius, shadow, space,
} from "../components/ds";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";

type ChurchData = { name: string; slug: string; address: string | null; timezone: string | null };

function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}><Icon name={icon} size={18} color={palette.amber} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function ChurchInfoScreen({ navigation }: any) {
  const { profile } = useAuth();
  const [church, setChurch] = useState<ChurchData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const churchId = profile?.church_id;
    if (!supabase || !churchId) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("churches").select("name, slug, address, timezone").eq("id", churchId).maybeSingle();
      if (!cancelled) { setChurch((data as ChurchData | null) ?? null); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [profile?.church_id]);

  return (
    <Screen>
      <AppBar onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space.gutter, paddingTop: 12, paddingBottom: 60 }}>
        {loading ? (
          <Loader />
        ) : !church ? (
          <Txt variant="body" color="inkMuted" style={{ marginTop: 24 }}>Church details could not be loaded.</Txt>
        ) : (
          <>
            <View style={styles.hero}>
              <BrandMark size={68} rounding={22} glow style={{ marginBottom: 16 }} />
              <Text style={styles.churchName}>{church.name}</Text>
              <Eyebrow>Your church</Eyebrow>
            </View>

            <View style={styles.card}>
              {church.address ? (<><InfoRow icon="mapPin" label="ADDRESS" value={church.address} /><Divider inset={54} /></>) : null}
              {church.timezone ? (<><InfoRow icon="clock" label="TIMEZONE" value={church.timezone} /><Divider inset={54} /></>) : null}
              <InfoRow icon="link" label="JOIN LINK" value={`/join/${church.slug}`} />
            </View>

            <View style={styles.joinCard}>
              <Text style={styles.joinEyebrow}>MEMBER JOIN LINK</Text>
              <Text style={styles.joinSlug}>/join/{church.slug}</Text>
              <Text style={styles.joinDesc}>Share this with people to let them join your church.</Text>
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", paddingVertical: 16, marginBottom: 8 },
  churchName: { fontFamily: font.bold, fontSize: 26, color: palette.ink, letterSpacing: -0.4, textAlign: "center", marginBottom: 8 },
  card: { backgroundColor: palette.surface, borderRadius: radius.xl, overflow: "hidden", marginBottom: 16, ...shadow.sm },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
  infoIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: palette.amberSofter, alignItems: "center", justifyContent: "center" },
  infoLabel: { fontFamily: font.bold, fontSize: 10, color: palette.inkMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 },
  infoValue: { fontFamily: font.semibold, fontSize: 15, color: palette.ink, lineHeight: 21 },
  joinCard: { backgroundColor: palette.amberSofter, borderRadius: radius.xl, padding: 20 },
  joinEyebrow: { fontFamily: font.bold, fontSize: 10, color: palette.amberDeep, letterSpacing: 1.6 },
  joinSlug: { fontFamily: font.bold, fontSize: 17, color: palette.amberDeep, marginTop: 8 },
  joinDesc: { fontFamily: font.regular, fontSize: 13, color: palette.inkSoft, marginTop: 6, lineHeight: 19 },
});
