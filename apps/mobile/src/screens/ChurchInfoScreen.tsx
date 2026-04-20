import React from "react";
import { View, Text, ScrollView } from "react-native";
import { AppShell } from "../components/app/AppShell";
import { StitchStackBackRow, StitchHero } from "../components/app/StitchStackChrome";
import { theme } from "../theme/theme";
import { STITCH_PAD_H, stitchFilledCard } from "../theme/stitch";

export default function ChurchInfoScreen({ navigation }: { navigation: { goBack: () => void; navigate: (n: string, p?: object) => void } }) {
  const church = { name: "Grace Church", joinCode: "ABCD1234" };
  return (
    <AppShell>
      <StitchStackBackRow navigation={navigation} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: STITCH_PAD_H }}>
        <StitchHero title="Church" subtitle={church.name} />
        <View style={stitchFilledCard()}>
          <Text style={{ fontFamily: theme.typography.fontFamily, fontWeight: theme.typography.fontWeight.semibold as any, fontSize: 20, color: theme.colors.primaryText }}>{church.name}</Text>
          <Text style={{ fontFamily: theme.typography.fontFamily, color: theme.colors.textSecondary, marginTop: 8 }}>Join code: {church.joinCode}</Text>
        </View>
      </ScrollView>
    </AppShell>
  );
}
