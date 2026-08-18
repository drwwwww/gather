import React from "react";
import { Text, Image, View, ScrollView, StyleSheet } from "react-native";
import { Screen, AppBar, Txt, Eyebrow, Card, palette, font, type, space } from "../components/ds";

type AnnouncementParams = {
  id?: string; title?: string; body?: string; message?: string; publish_at?: string | null; date?: string; image_url?: string | null;
};

function formatWhen(when: string | null | undefined): string {
  if (!when) return "";
  try { return new Date(when).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }); }
  catch { return ""; }
}

export default function AnnouncementsDetailScreen({ navigation, route }: any) {
  const a = route.params?.announcement as AnnouncementParams | undefined;
  const title = a?.title ?? "News";
  const body = a?.body ?? a?.message ?? "";
  const whenLabel = formatWhen(a?.publish_at ?? a?.date);

  return (
    <Screen>
      <AppBar onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {a?.image_url ? (
          <Image source={{ uri: a.image_url }} style={styles.hero} resizeMode="cover" />
        ) : null}
        <View style={{ paddingHorizontal: space.gutter, paddingTop: a?.image_url ? 18 : 20 }}>
          {whenLabel ? <Eyebrow>{whenLabel}</Eyebrow> : null}
          <Text style={styles.title}>{title}</Text>
          <Card elevation="md" style={{ padding: 20 }}>
            <Txt variant="bodyLg" color="inkSoft" style={{ lineHeight: 26 }}>{body}</Txt>
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { width: "100%", height: 220, backgroundColor: palette.sunken },
  title: { ...type.h1, color: palette.ink, lineHeight: 34, marginTop: 10, marginBottom: 20 },
});
