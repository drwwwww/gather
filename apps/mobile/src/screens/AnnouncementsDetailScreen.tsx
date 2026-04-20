import React from "react";
import { Text, ScrollView, View } from "react-native";
import { AppShell } from "../components/app/AppShell";
import { StitchStackBackRow, StitchHero } from "../components/app/StitchStackChrome";
import { theme } from "../theme/theme";
import { STITCH_PAD_H, stitchFilledCard } from "../theme/stitch";

type AnnouncementParams = {
  id?: string;
  title?: string;
  body?: string;
  message?: string;
  publish_at?: string | null;
  date?: string;
};

export default function AnnouncementsDetailScreen({ navigation, route }: any) {
  const announcement = route.params?.announcement as AnnouncementParams | undefined;
  const title = announcement?.title ?? "News";
  const body = announcement?.body ?? announcement?.message ?? "";
  const when = announcement?.publish_at ?? announcement?.date;

  return (
    <AppShell>
      <StitchStackBackRow navigation={navigation} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: STITCH_PAD_H }}>
        <StitchHero title={title} subtitle={when ? (typeof when === "string" && when.includes("T") ? new Date(when).toLocaleString() : String(when)) : undefined} />

        <View style={stitchFilledCard()}>
          <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: theme.typography.fontSize.md, lineHeight: 24, color: theme.colors.primaryText }}>{body}</Text>
        </View>
      </ScrollView>
    </AppShell>
  );
}
